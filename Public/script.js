async function loadFragment(holderId, url){
  const res = await fetch(url);
  if(!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  document.getElementById(holderId).innerHTML = await res.text();
}

/* ------------ config ------------ */
const DATA_PATH = '/api/getData';   
let   DATA     = [];                      // parsed JSON
const YEARS    = ['2023','2024','2025'];

/* ------------ init ------------ */
document.addEventListener('DOMContentLoaded', async () => {
  /* shell */
  const root = document.getElementById('root');
  root.innerHTML = `<div id="navbar-holder"></div><div class="container" id="content-holder"></div>`;

  /* fragments */
  await loadFragment('navbar-holder', 'components/navbar.html');
  const content = document.getElementById('content-holder');
  content.innerHTML = `<div id="search-holder"></div><div id="compare-holder"></div><div id="login-holder"></div>`;
  await loadFragment('search-holder',  'components/searchCard.html');
  await loadFragment('compare-holder', 'components/comparePanel.html');
  await loadFragment('login-holder',   'components/loginForm.html');

  /* data */
  DATA = await fetch(DATA_PATH).then(r=>r.json());

  /* top-10 */
  loadTopGDPStatesWithCities();

  /* compare dropdowns */
  ['state1','state2'].forEach(id=>{
    const sel = document.getElementById(id);
    DATA.forEach(s=>{
      const o=document.createElement('option');o.value=o.textContent=s.state;sel.appendChild(o);
    });
  });

  /* modal buttons */
  const loginModal=document.getElementById('loginModal');
  document.getElementById('loginOpenBtn').onclick=()=>loginModal.classList.remove('hidden');
  document.getElementById('closeModal' ).onclick=()=>loginModal.classList.add   ('hidden');

  /* action buttons */
  document.getElementById('searchBtn').onclick = handleSearch;
  document.getElementById('compareBtn').onclick= handleCompare;
  document.getElementById('backBtn').onclick   = () => {
    document.getElementById('detailView')   .classList.add   ('hidden');
    document.getElementById('defaultGDPList').classList.remove('hidden');
  };
});

/* ------------ search ------------ */
let searchChart=null;
function handleSearch(){
  const q=document.getElementById('searchInput').value.trim().toLowerCase();
  if(!q) return;
  const match = DATA.find(d=>d.state.toLowerCase()===q||d.capital.city.toLowerCase()===q);
  const resDiv=document.getElementById('searchResult');
  if(!match){resDiv.textContent='No match found.';return;}

  const gdps=YEARS.map(y=>match.stateData[y].economic.gdpUsdBn);
  resDiv.innerHTML=`
    <h3>${match.state}</h3>
    <p>GDP 2025: $${gdps[2]} Bn | HDI 2025: ${match.stateData['2025'].social.hdi}</p>`;

  const ctx=document.getElementById('searchChart');
  if(searchChart) searchChart.destroy();
  searchChart=new Chart(ctx,{
    type:'bar',
    data:{labels:YEARS,datasets:[{label:`GDP (US $ Bn) – ${match.state}`,data:gdps,
           backgroundColor:['var(--secondary)','var(--tertiary)','var(--accent)']}]},
    options:{plugins:{legend:{display:false}}}
  });
}

/* ------------ compare ------------ */
let compareChart=null;
function handleCompare(){
  const s1=document.getElementById('state1').value;
  const s2=document.getElementById('state2').value;
  if(s1===s2) return alert('Choose two different regions!');
  const st1=DATA.find(d=>d.state===s1);
  const st2=DATA.find(d=>d.state===s2);
  const vals1=YEARS.map(y=>st1.stateData[y].economic.gdpUsdBn);
  const vals2=YEARS.map(y=>st2.stateData[y].economic.gdpUsdBn);
  document.getElementById('diffBox').innerHTML=
    `<p>GDP difference in 2025: <strong>$${Math.abs(vals1[2]-vals2[2])} Bn</strong></p>`;
  const ctx=document.getElementById('compareChart');
  if(compareChart) compareChart.destroy();
  compareChart=new Chart(ctx,{
    type:'line',
    data:{labels:YEARS,datasets:[
      {label:s1,data:vals1,borderColor:'var(--secondary)',tension:.3},
      {label:s2,data:vals2,borderColor:'var(--accent)',  tension:.3}]},
    options:{plugins:{legend:{position:'bottom'}}}
  });
}

/* ------------ top-10 list ------------ */
function loadTopGDPStatesWithCities(){
  const listEl=document.getElementById('defaultGDPList');if(!listEl||!DATA.length)return;
  const top10=DATA.map(s=>{
      const y=Math.max(...Object.keys(s.stateData).map(Number));
      return {state:s.state,city:s.capital.city,gdp:s.stateData[y].economic.gdpUsdBn,year:y};
    }).sort((a,b)=>b.gdp-a.gdp).slice(0,10);
  listEl.innerHTML=`
    <h3>Top 10 GDP Contributing States & Cities</h3>
    <ul>${top10.map((s,i)=>`
      <li>
        <strong>${i+1}. ${s.state}</strong> – ${s.city}
        <span style="float:right;color:#666">$${formatBn(s.gdp)} Bn (${s.year})</span>
        <button class="btn" style="margin-left:.5rem;padding:.2rem .55rem;font-size:.8rem"
                onclick="showDashboard('${s.state}')">More info →</button>
      </li>`).join('')}</ul>`;
}

/* ------------ dashboard reuse ------------ */
let gdpChart=null;
function showDashboard(stateName){
  const s=DATA.find(d=>d.state===stateName);if(!s)return;
  document.getElementById('defaultGDPList').classList.add('hidden');
  document.getElementById('detailView')   .classList.remove('hidden');
  document.getElementById('detailTitle').textContent=`${stateName} — Snapshot (2023-25)`;
  const latest=s.stateData['2025'];const cap=s.capital.data['2025'].values;
  const cards=[
    {label:'GDP',val:`$${latest.economic.gdpUsdBn} Bn`},
    {label:'GDP Growth',val:`${latest.economic.gdpGrowthRate}%`},
    {label:'HDI',val:latest.social.hdi},
    {label:'Literacy',val:`${cap.literacyRate}%`},
    {label:'Population',val:`${cap.populationMillions} M`},
    {label:'Unemployment',val:`${cap.unemploymentRate}%`},
    {label:'Per-Capita Income',val:`$${cap.perCapitaIncomeUsd}`},
    {label:'AQI',val:cap.aqi}
  ];
  document.getElementById('metricCards').innerHTML=
    cards.map(c=>`<div class="card"><h4>${c.label}</h4><p>${c.val}</p></div>`).join('');
  const gdps=YEARS.map(y=>s.stateData[y].economic.gdpUsdBn);
  if(gdpChart) gdpChart.destroy();
  gdpChart=new Chart(document.getElementById('gdpCanvas'),{
    type:'bar',
    data:{labels:YEARS,datasets:[{label:'GDP (US $ Bn)',data:gdps,
           backgroundColor:['var(--secondary)','var(--tertiary)','var(--accent)']}]},
    options:{plugins:{legend:{display:false}}}
  });
}

/* ------------ helpers ------------ */
function formatBn(n){return n.toLocaleString('en-US',{maximumFractionDigits:1});}
