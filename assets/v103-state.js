(() => {
'use strict';
const CU=window.CU;
function ensure(){
  CU.state.meta.version='10.3';
  CU.state.ui.salesView=CU.state.ui.salesView||'funnel';
  CU.state.monthClosures=CU.state.monthClosures||{};
  CU.state.clientNotes=CU.state.clientNotes||[];
  CU.state.projects.forEach(p=>{if(!('processSnapshot' in p))p.processSnapshot=null});
  const month=CU.state.meta.financeMonth||CU.month();
  if(!CU.state.monthClosures[month])CU.state.monthClosures[month]={items:{payments:false,expenses:false,overdue:false,recurrence:false,budget:false,nextMonth:false},closedAt:null,closedBy:null};
}
ensure();
CU.ensureV103State=ensure;
})();