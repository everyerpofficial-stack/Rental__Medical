import{$ as e,D as t,E as n,H as r,M as i,T as a,W as o,b as ee,g as s,it as c,st as te,vt as l,xt as u,z as d}from"./data-store-DlBk7OH-.js";import{S as f,a as p,b as ne,i as m,n as re,o as h,s as g,t as ie,y as ae}from"./AppShell-BNdw9zAz.js";import{t as oe}from"./calendar-days-BEaqa40N.js";import{t as se}from"./combobox-C6D0jgjR.js";import{t as _}from"./circle-check-Zra0Jgtk.js";import{t as ce}from"./eye-C2gnvHO2.js";import{t as le}from"./plus-HdRnY_lD.js";import{t as ue}from"./printer-N8giiL_g.js";import{G as v,H as y,W as b,_ as x,a as S,at as C,b as de,ft as w,g as fe,h as T,i as E,n as D,ot as O,p as pe,r as k,t as A,v as me,y as he}from"./index-Bf1ueTgA.js";import{a as ge,i as j,n as _e,o as M,r as N,t as ve}from"./table-DWzTQwhY.js";var ye=C(`clipboard-list`,[[`rect`,{width:`8`,height:`4`,x:`8`,y:`2`,rx:`1`,ry:`1`,key:`tgr4d6`}],[`path`,{d:`M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2`,key:`116196`}],[`path`,{d:`M12 11h4`,key:`1jrz19`}],[`path`,{d:`M12 16h4`,key:`n85exb`}],[`path`,{d:`M8 11h.01`,key:`1dfujw`}],[`path`,{d:`M8 16h.01`,key:`18s6g9`}]]),P=u(l()),F=w();function I(){let l=te(),[u,_]=(0,P.useState)(()=>n()),[C,w]=(0,P.useState)(()=>d()),[I,L]=(0,P.useState)(()=>a()),[xe,Se]=(0,P.useState)(``),[R,Ce]=(0,P.useState)(`all`),[z,B]=(0,P.useState)(!1),[V,we]=(0,P.useState)(null),[Te,Ee]=(0,P.useState)(null),[De,Oe]=(0,P.useState)(``),[H,U]=(0,P.useState)(``),[ke,W]=(0,P.useState)(``),[Ae,je]=(0,P.useState)(``),[G,Me]=(0,P.useState)([]),[K,q]=(0,P.useState)(``),[Ne,J]=(0,P.useState)(``),[Pe,Y]=(0,P.useState)(``),[X,Fe]=(0,P.useState)(``),[Ie,Le]=(0,P.useState)(``),[Re,ze]=(0,P.useState)(``),[Be,Ve]=(0,P.useState)(``),[He,Ue]=(0,P.useState)(`UnderMaintenance`),[We,Ge]=(0,P.useState)(``),[Ke,qe]=(0,P.useState)(`Completed`),[Je,Z]=(0,P.useState)(``),[Q,Ye]=(0,P.useState)(`HaveInStock`),[Xe,$]=(0,P.useState)(!1),Ze=(0,P.useRef)(``);(0,P.useEffect)(()=>{_(n()),w(d()),L(a())},[l]),(0,P.useEffect)(()=>{z&&(L(a()),w(d()))},[z]),(0,P.useEffect)(()=>{let e=new URLSearchParams(window.location.search).get(`agreementId`);e&&(U(e),B(!0),window.history.replaceState({},document.title,window.location.pathname))},[]),(0,P.useEffect)(()=>{let e=new URLSearchParams(window.location.search).get(`equipmentId`);e&&G.some(t=>t.equipmentId===e)&&q(e)},[G]),(0,P.useEffect)(()=>{let e=new URLSearchParams(window.location.search).get(`newEquipmentId`);e&&Fe(e)},[z]);let Qe=()=>{_(n()),w(d()),L(a())};(0,P.useEffect)(()=>{z&&(Oe(o()),Ve(t()),U(``),W(``),je(``),Me([]),q(``),J(``),Y(``),Fe(``),Le(``),ze(``),Ue(`UnderMaintenance`),Ge(``),qe(`Completed`),Z(``),Ye(`HaveInStock`))},[z]),(0,P.useEffect)(()=>{if(H!==Ze.current)if(Ze.current=H,H){let e=C.find(e=>e.id===H);if(e){W(e.customer),je(e.customerId);let t=[];if(e.equipmentItems&&e.equipmentItems.length>0)t=e.equipmentItems.filter(e=>!e.returned);else if(e.equipmentId){let n=e.equipmentId.split(`,`).map(e=>e.trim()).filter(Boolean),r=(e.serial||``).split(`,`).map(e=>e.trim()).filter(Boolean),i=(e.equipment||``).split(`,`).map(e=>e.trim()).filter(Boolean);t=n.map((t,n)=>({equipmentId:t,serial:r[n]||`Unknown`,name:i[n]||e.equipment||`Equipment`}))}Me(t),t.length>0?q(t[0].equipmentId):(q(``),J(``),Y(``))}}else W(``),je(``),Me([]),q(``),J(``),Y(``)},[H,C]),(0,P.useEffect)(()=>{if(K){let e=G.find(e=>e.equipmentId===K);e&&(J(e.name||$e(K)),Y(e.serial));let t=I.find(e=>e.id===K);t&&t.owner?Z(t.owner):Z(``)}else J(``),Y(``),Z(``)},[K,G,I]),(0,P.useEffect)(()=>{if(X){let e=I.find(e=>e.id===X);e&&(Le(e.name),ze(e.serial||``))}else Le(``),ze(``)},[X,I]),(0,P.useEffect)(()=>{Q===`NeedFromOwner`&&qe(`Pending`)},[Q]);let $e=e=>{let t=I.find(t=>t.id===e);return t?t.name:`Unknown Equipment`},et=I.filter(e=>String(e.status||``).trim().toLowerCase()===`available`),tt=t=>{if(t.preventDefault(),Xe)return;if($(!0),!H){O.error(`Please select a rental agreement`),$(!1);return}let n=C.find(e=>e.id===H);if(n&&n.start){let e=r(n.start),t=r(Be);if(!isNaN(e.getTime())&&!isNaN(t.getTime())&&t<e){O.error(`Exchange date cannot be earlier than agreement start date.`),$(!1);return}}if(!K){O.error(`Agreement has no active equipment to exchange`),$(!1);return}if(Ke===`Completed`&&!X){O.error(`Please select a new replacement equipment`),$(!1);return}if(X===K){O.error(`Cannot exchange an item with itself`),$(!1);return}let a=i();Oe(a),e({id:a,agreementId:H,customer:ke,customerId:Ae,currentEquipment:Ne,currentEquipmentId:K,currentEquipmentSerial:Pe,newEquipment:Ie,newEquipmentId:X,newEquipmentSerial:Re,exchangeDate:Be,releaseCondition:He,reason:We,ownerName:Q===`HaveInStock`?``:Je,sourcingStatus:Q,status:Ke}),O.success(`Exchange request ${a} saved successfully!`),$(!1),B(!1),Qe()},nt=u.length,rt=u.filter(e=>e.status===`Pending`).length,it=u.filter(e=>e.status===`Completed`).length,at=new Date().getMonth(),ot=new Date().getFullYear(),st=u.filter(e=>{let t=new Date(e.exchangeDate);return!isNaN(t.getTime())&&t.getMonth()===at&&t.getFullYear()===ot}).length,ct=(0,P.useMemo)(()=>ee(),[l]),lt=c(u.filter(e=>{let t=xe.toLowerCase().trim(),n=ct.find(t=>t.name.toLowerCase()===(e.customer||``).toLowerCase()||t.id===e.customerId),r=!t||(e.id||``).toLowerCase().includes(t)||(e.customer||``).toLowerCase().includes(t)||(e.agreementId||``).toLowerCase().includes(t)||String(e.currentEquipment||e.oldEquipment||``).toLowerCase().includes(t)||String(e.newEquipment||``).toLowerCase().includes(t)||String(e.currentEquipmentSerial||e.oldEquipmentSerial||``).toLowerCase().includes(t)||String(e.newEquipmentSerial||``).toLowerCase().includes(t)||n&&(String(n.phone||``).toLowerCase().includes(t)||String(n.altPhone||``).toLowerCase().includes(t)||String(n.contactNumber3||``).toLowerCase().includes(t)),i=R===`all`||e.status===R;return r&&i}),`exchangeDate`),ut=e=>{if(!e||typeof window>`u`)return;let t=window.open(``,`_blank`);if(!t){O.error(`Please allow popups to print the exchange slip.`);return}let n=`
<!DOCTYPE html>
<html>
<head>
  <title>Exchange Slip ${e.id}</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 40px;
      line-height: 1.5;
      background-color: #ffffff;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
      position: relative;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo-area h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: #1e3a8a;
      margin: 0;
    }
    .logo-area p {
      font-size: 11px;
      color: #64748b;
      margin: 4px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .slip-title {
      text-align: right;
    }
    .slip-title h2 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .slip-title p {
      font-size: 13px;
      color: #64748b;
      margin: 6px 0 0 0;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 30px;
    }
    .meta-box h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin: 0 0 8px 0;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }
    .meta-box p {
      font-size: 13.5px;
      font-weight: 600;
      color: #1e293b;
      margin: 4px 0;
    }
    .meta-box p span {
      font-weight: 400;
      color: #64748b;
    }
    .table-section {
      margin-bottom: 30px;
    }
    .table-section h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #64748b;
      margin: 0 0 12px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      background-color: #f8fafc;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1.5px solid #e2e8f0;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .reason-box {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 40px;
      border-left: 4px solid #3b82f6;
    }
    .reason-box h4 {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      margin: 0 0 8px 0;
    }
    .reason-box p {
      font-size: 13px;
      margin: 0;
      color: #334155;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px dashed #e2e8f0;
    }
    .sig-block {
      text-align: center;
      width: 200px;
    }
    .sig-line {
      border-top: 1px solid #94a3b8;
      margin-top: 40px;
      padding-top: 6px;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-area">
        <h1>Relife</h1>
        <p>Medical Technologies</p>
      </div>
      <div class="slip-title">
        <h2>Equipment Exchange Slip</h2>
        <p>ID: ${e.id}</p>
      </div>
    </div>

    <div class="grid">
      <div class="meta-box">
        <h3>Agreement Details</h3>
        <p><span>Agreement No:</span> ${e.agreementId}</p>
        <p><span>Customer Name:</span> ${e.customer}</p>
      </div>
      <div class="meta-box">
        <h3>Exchange Info</h3>
        <p><span>Exchange Date:</span> ${s(e.exchangeDate)}</p>
        <p><span>Status:</span> ${e.status}</p>
      </div>
    </div>

    <div class="table-section">
      <h3>Equipment Swapped</h3>
      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>Item Name</th>
            <th>Serial Number</th>
            <th>Status / Condition</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Returned (Old)</strong></td>
            <td>${e.currentEquipment}</td>
            <td><code>${e.currentEquipmentSerial}</code></td>
            <td>Released (${e.releaseCondition===`UnderMaintance`||e.releaseCondition===`UnderMaintenance`?`Under Maintenance`:e.releaseCondition===`Returned to Owner`?`Returned to Owner`:`Available`})</td>
          </tr>
          <tr>
            <td><strong>Assigned (New)</strong></td>
            <td>${e.newEquipment||`—`}</td>
            <td><code>${e.newEquipmentSerial||`—`}</code></td>
            <td>${e.status===`Completed`?`Active (Rented)`:`Pending Assignment`}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="reason-box">
      <h4>Reason for Exchange</h4>
      <p>${e.reason||`No reason provided.`}</p>
    </div>

    <div class="footer">
      <div class="sig-block">
        <div class="sig-line">Customer Signature</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Authorized Signatory</div>
      </div>
    </div>
  </div>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  <\/script>
</body>
</html>
    `;t.document.write(n),t.document.close()};return(0,F.jsxs)(ie,{title:`Equipment Exchanges`,subtitle:`Manage and process equipment exchange requests under rental agreements`,children:[(0,F.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 sm:gap-4 sm:gap-5 md:grid-cols-4 mb-6`,children:[(0,F.jsxs)(m,{className:`border border-border/50 shadow-soft`,children:[(0,F.jsxs)(h,{className:`flex flex-row items-center justify-between space-y-0 pb-2`,children:[(0,F.jsx)(g,{className:`text-[11px] font-bold uppercase tracking-wider text-muted-foreground`,children:`Total Swaps`}),(0,F.jsx)(f,{className:`h-4 w-4 text-primary`})]}),(0,F.jsxs)(p,{children:[(0,F.jsx)(`div`,{className:`text-2xl font-bold tracking-tight text-foreground`,children:nt}),(0,F.jsx)(`p`,{className:`text-[11px] text-muted-foreground mt-1`,children:`Exchanges logged`})]})]}),(0,F.jsxs)(m,{className:`border border-border/50 shadow-soft`,children:[(0,F.jsxs)(h,{className:`flex flex-row items-center justify-between space-y-0 pb-2`,children:[(0,F.jsx)(g,{className:`text-[11px] font-bold uppercase tracking-wider text-muted-foreground`,children:`Completed Swaps`}),(0,F.jsx)(ye,{className:`h-4 w-4 text-success`})]}),(0,F.jsxs)(p,{children:[(0,F.jsx)(`div`,{className:`text-2xl font-bold tracking-tight text-success`,children:it}),(0,F.jsx)(`p`,{className:`text-[11px] text-muted-foreground mt-1`,children:`Swaps executed in inventory`})]})]}),(0,F.jsxs)(m,{className:`border border-border/50 shadow-soft`,children:[(0,F.jsxs)(h,{className:`flex flex-row items-center justify-between space-y-0 pb-2`,children:[(0,F.jsx)(g,{className:`text-[11px] font-bold uppercase tracking-wider text-muted-foreground`,children:`Pending Requests`}),(0,F.jsx)(ae,{className:`h-4 w-4 text-warning`})]}),(0,F.jsxs)(p,{children:[(0,F.jsx)(`div`,{className:`text-2xl font-bold tracking-tight text-warning`,children:rt}),(0,F.jsx)(`p`,{className:`text-[11px] text-muted-foreground mt-1`,children:`Awaiting dispatch/swap`})]})]}),(0,F.jsxs)(m,{className:`border border-border/50 shadow-soft`,children:[(0,F.jsxs)(h,{className:`flex flex-row items-center justify-between space-y-0 pb-2`,children:[(0,F.jsx)(g,{className:`text-[11px] font-bold uppercase tracking-wider text-muted-foreground`,children:`Swaps This Month`}),(0,F.jsx)(oe,{className:`h-4 w-4 text-blue-500`})]}),(0,F.jsxs)(p,{children:[(0,F.jsx)(`div`,{className:`text-2xl font-bold tracking-tight text-foreground`,children:st}),(0,F.jsxs)(`p`,{className:`text-[11px] text-muted-foreground mt-1`,children:[`In `,new Date().toLocaleString(`en-IN`,{month:`long`})]})]})]})]}),(0,F.jsxs)(`div`,{className:`space-y-4`,children:[(0,F.jsxs)(`div`,{className:`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between`,children:[(0,F.jsxs)(`div`,{className:`flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:max-w-2xl`,children:[(0,F.jsxs)(`div`,{className:`relative flex-1`,children:[(0,F.jsx)(ne,{className:`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60`}),(0,F.jsx)(b,{placeholder:`Search Exchange ID, Customer, Agreement...`,value:xe,onChange:e=>Se(e.target.value),className:`pl-9 h-10 border-border/50 text-[13px] rounded-lg focus-visible:ring-1 focus-visible:ring-primary/45 w-full`})]}),(0,F.jsxs)(A,{value:R,onValueChange:Ce,children:[(0,F.jsx)(E,{className:`w-full sm:w-[160px] h-10 border-border/50 text-[13px] rounded-lg`,children:(0,F.jsx)(S,{placeholder:`Filter Status`})}),(0,F.jsxs)(D,{className:`border border-border/60 bg-popover shadow-elevated rounded-lg`,children:[(0,F.jsx)(k,{value:`all`,className:`text-[13px] cursor-pointer`,children:`All Statuses`}),(0,F.jsx)(k,{value:`Completed`,className:`text-[13px] cursor-pointer`,children:`Completed`}),(0,F.jsx)(k,{value:`Pending`,className:`text-[13px] cursor-pointer`,children:`Pending`})]})]})]}),(0,F.jsxs)(v,{onClick:()=>B(!0),className:`h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg font-medium text-[13px] shadow-sm cursor-pointer border-0`,children:[(0,F.jsx)(le,{className:`h-4.5 w-4.5`}),` New Exchange Request`]})]}),(0,F.jsx)(m,{className:`border border-border/50 shadow-soft overflow-hidden`,children:(0,F.jsxs)(ve,{children:[(0,F.jsx)(ge,{className:`bg-muted/40`,children:(0,F.jsxs)(M,{className:`hover:bg-transparent border-b border-border/40`,children:[(0,F.jsx)(j,{className:`font-semibold text-muted-foreground/80 h-11 text-[12.5px]`,children:`Exchange ID`}),(0,F.jsx)(j,{className:`font-semibold text-muted-foreground/80 h-11 text-[12.5px]`,children:`Date`}),(0,F.jsx)(j,{className:`font-semibold text-muted-foreground/80 h-11 text-[12.5px]`,children:`Agreement No`}),(0,F.jsx)(j,{className:`font-semibold text-muted-foreground/80 h-11 text-[12.5px]`,children:`Customer`}),(0,F.jsx)(j,{className:`font-semibold text-muted-foreground/80 h-11 text-[12.5px]`,children:`Returned Item (Serial)`}),(0,F.jsx)(j,{className:`font-semibold text-muted-foreground/80 h-11 text-[12.5px]`,children:`New Item (Serial)`}),(0,F.jsx)(j,{className:`font-semibold text-muted-foreground/80 h-11 text-[12.5px]`,children:`Reason`}),(0,F.jsx)(j,{className:`font-semibold text-muted-foreground/80 h-11 text-[12.5px]`,children:`Status`}),(0,F.jsx)(j,{className:`font-semibold text-muted-foreground/80 h-11 text-[12.5px] text-right`,children:`Actions`})]})}),(0,F.jsx)(_e,{children:lt.length===0?(0,F.jsx)(M,{children:(0,F.jsx)(N,{colSpan:9,className:`text-center py-10 text-muted-foreground text-[13px]`,children:`No exchange requests found.`})}):lt.map(e=>(0,F.jsxs)(M,{className:`hover:bg-muted/10 border-b border-border/40 transition-colors`,children:[(0,F.jsx)(N,{className:`font-semibold text-foreground text-[13px]`,children:(0,F.jsx)(`code`,{children:e.id})}),(0,F.jsx)(N,{className:`text-[13px] text-slate-600`,children:s(e.exchangeDate)}),(0,F.jsx)(N,{className:`text-[13px] font-medium text-primary`,children:(0,F.jsx)(`code`,{children:e.agreementId})}),(0,F.jsx)(N,{className:`text-[13px] font-semibold text-slate-800`,children:e.customer}),(0,F.jsxs)(N,{className:`text-[13px] text-slate-600`,children:[(0,F.jsx)(`div`,{children:e.currentEquipment}),(0,F.jsx)(`code`,{className:`text-[11px] text-muted-foreground`,children:e.currentEquipmentSerial})]}),(0,F.jsx)(N,{className:`text-[13px] text-slate-600`,children:e.newEquipment?(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)(`div`,{children:e.newEquipment}),(0,F.jsx)(`code`,{className:`text-[11px] text-muted-foreground`,children:e.newEquipmentSerial})]}):(0,F.jsx)(`span`,{className:`text-muted-foreground italic text-[12px]`,children:`Pending swap`})}),(0,F.jsx)(N,{className:`text-[13px] text-slate-500 max-w-[200px] truncate`,title:e.reason,children:e.reason}),(0,F.jsx)(N,{className:`text-[13px]`,children:(0,F.jsx)(re,{status:e.status})}),(0,F.jsx)(N,{className:`text-right`,children:(0,F.jsxs)(`div`,{className:`flex items-center justify-end gap-1.5`,children:[(0,F.jsx)(v,{variant:`ghost`,size:`icon`,className:`h-8 w-8 hover:bg-slate-100 rounded-md`,onClick:()=>we(e),title:`View Details`,children:(0,F.jsx)(ce,{className:`h-4 w-4 text-slate-600`})}),(0,F.jsx)(v,{variant:`ghost`,size:`icon`,className:`h-8 w-8 hover:bg-slate-100 rounded-md`,onClick:()=>ut(e),title:`Print Exchange Slip`,children:(0,F.jsx)(ue,{className:`h-4 w-4 text-slate-600`})})]})})]},e.id))})]})})]}),(0,F.jsx)(T,{open:z,onOpenChange:B,children:(0,F.jsxs)(x,{className:`max-w-2xl bg-white border border-slate-100 rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] max-h-[90vh] overflow-y-auto`,children:[(0,F.jsx)(he,{className:`border-b border-slate-100 pb-3`,children:(0,F.jsxs)(de,{className:`text-lg font-bold text-slate-900 flex items-center gap-2`,children:[(0,F.jsx)(f,{className:`h-5 w-5 text-primary animate-[spin_3s_linear_infinite]`}),` Create Exchange Request`]})}),(0,F.jsxs)(`form`,{onSubmit:tt,className:`space-y-4 pt-4`,children:[(0,F.jsxs)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 gap-4`,children:[(0,F.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,F.jsx)(y,{className:`text-[11px] font-bold uppercase tracking-wider text-slate-400`,children:`Exchange ID (Auto)`}),(0,F.jsx)(b,{value:De,disabled:!0,className:`h-10 bg-slate-50 border-slate-200 text-slate-500 font-semibold text-[13px] rounded-lg`})]}),(0,F.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,F.jsx)(y,{className:`text-[11px] font-bold uppercase tracking-wider text-slate-400`,children:`Exchange Date`}),(0,F.jsx)(b,{type:`date`,value:Be,onChange:e=>Ve(e.target.value),required:!0,className:`h-10 border-slate-200 text-slate-700 text-[13px] rounded-lg`})]})]}),(0,F.jsxs)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 gap-4`,children:[(0,F.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,F.jsx)(y,{className:`text-[11px] font-bold uppercase tracking-wider text-slate-400`,children:`Rental Agreement No`}),(0,F.jsx)(se,{options:C.filter(e=>e.status===`Active`||e.status===`Overdue`).map(e=>{let t=ct.find(t=>t.id===e.customerId||t.name&&e.customer&&t.name.toLowerCase()===e.customer.toLowerCase()),n=e.phone||t?.phone||``,r=[n,e.altPhone||t?.altPhone||``,e.contactNumber3||t?.contactNumber3||``].filter(Boolean).join(` `),i=n?` · ${n}`:``;return{value:e.id,label:`${e.id} — ${e.customer}${i}`,searchTerms:`${e.customerId||``} ${e.customer||``} ${r} ${e.equipment||``} ${e.serial||``}`}}),value:H,onValueChange:U,placeholder:`Select active rental...`,searchPlaceholder:`Search agreement no, customer or contact number...`})]}),(0,F.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,F.jsx)(y,{className:`text-[11px] font-bold uppercase tracking-wider text-slate-400`,children:`Customer`}),(0,F.jsx)(b,{value:ke||`No rental selected`,disabled:!0,className:`h-10 bg-slate-50 border-slate-200 text-slate-500 font-semibold text-[13px] rounded-lg`})]})]}),H&&(0,F.jsxs)(`div`,{className:`p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-4`,children:[(0,F.jsx)(`h4`,{className:`text-[11px] font-bold uppercase tracking-wider text-blue-600`,children:`Equipment Swap Details`}),(0,F.jsxs)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 gap-4`,children:[(0,F.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,F.jsx)(y,{className:`text-[11px] font-bold uppercase tracking-wider text-slate-500`,children:`Current Equipment (To Return)`}),(0,F.jsxs)(A,{value:K,onValueChange:q,children:[(0,F.jsx)(E,{className:`h-10 border-slate-200 bg-white text-[13px] rounded-lg w-full`,children:(0,F.jsx)(S,{placeholder:`Select item to return`})}),(0,F.jsx)(D,{className:`border border-border/60 bg-popover shadow-elevated rounded-lg`,children:G.map(e=>(0,F.jsxs)(k,{value:e.equipmentId,children:[e.name||$e(e.equipmentId),` `,e.serial?`— ${e.serial}`:``]},e.equipmentId))})]})]}),(0,F.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,F.jsx)(y,{className:`text-[11px] font-bold uppercase tracking-wider text-slate-500`,children:`New Equipment (To Swap)`}),(0,F.jsx)(se,{options:et.map(e=>({value:e.id,label:e.serial?`${e.name} — ${e.serial}`:e.name})),value:X,onValueChange:Fe,placeholder:`Select available item...`,searchPlaceholder:`Search available inventory...`}),et.length===0&&(0,F.jsx)(`p`,{className:`text-[11px] text-destructive mt-1 font-medium`,children:`No items available in inventory`})]})]}),(0,F.jsxs)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 gap-4`,children:[(0,F.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,F.jsx)(y,{className:`text-[11px] font-bold uppercase tracking-wider text-slate-500`,children:`Returned Item Release Condition`}),(0,F.jsxs)(A,{value:He,onValueChange:e=>Ue(e),children:[(0,F.jsx)(E,{className:`h-10 border-slate-200 bg-white text-[13px] rounded-lg`,children:(0,F.jsx)(S,{placeholder:`Select condition`})}),(0,F.jsxs)(D,{className:`border border-border/60 bg-popover shadow-elevated rounded-lg`,children:[(0,F.jsx)(k,{value:`UnderMaintenance`,className:`text-[13px] cursor-pointer`,children:`Under Maintenance`}),(0,F.jsx)(k,{value:`Available`,className:`text-[13px] cursor-pointer`,children:`Good`})]})]})]}),(0,F.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,F.jsx)(y,{className:`text-[11px] font-bold uppercase tracking-wider text-slate-500`,children:`Exchange Action`}),(0,F.jsxs)(A,{value:Ke,onValueChange:e=>qe(e),children:[(0,F.jsx)(E,{className:`h-10 border-slate-200 bg-white text-[13px] rounded-lg disabled:opacity-80 disabled:bg-slate-50`,children:(0,F.jsx)(S,{placeholder:`Select status`})}),(0,F.jsxs)(D,{className:`border border-border/60 bg-popover shadow-elevated rounded-lg`,children:[(0,F.jsx)(k,{value:`Completed`,className:`text-[13px] cursor-pointer`,children:`Completed (Execute Swap Immediately)`}),(0,F.jsx)(k,{value:`Pending`,className:`text-[13px] cursor-pointer`,children:`Pending (Log Request Only)`})]})]})]})]})]}),(0,F.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,F.jsx)(y,{className:`text-[11px] font-bold uppercase tracking-wider text-slate-400`,children:`Reason for Exchange`}),(0,F.jsx)(pe,{placeholder:`Describe why this exchange is needed (e.g., compressor issue, low purity level, upgrading device model)...`,value:We,onChange:e=>Ge(e.target.value),required:!0,rows:3,className:`border-slate-200 text-slate-700 text-[13px] rounded-lg resize-none focus-visible:ring-1 focus-visible:ring-primary/45`})]}),(0,F.jsxs)(me,{className:`border-t border-slate-100 pt-4 flex gap-2 justify-end`,children:[(0,F.jsx)(fe,{asChild:!0,children:(0,F.jsx)(v,{type:`button`,variant:`outline`,className:`h-10 rounded-lg text-[13px] border-slate-200 hover:bg-slate-50 cursor-pointer`,children:`Cancel`})}),(0,F.jsx)(v,{type:`submit`,className:`h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg text-[13px] font-medium cursor-pointer border-0 shadow-sm`,children:`Save Exchange`})]})]})]})}),(0,F.jsx)(T,{open:!!V,onOpenChange:e=>!e&&we(null),children:V&&(0,F.jsxs)(x,{className:`max-w-xl bg-white border border-slate-100 rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]`,children:[(0,F.jsx)(he,{className:`border-b border-slate-100 pb-3`,children:(0,F.jsxs)(de,{className:`text-lg font-bold text-slate-900`,children:[`Exchange Details — `,V.id]})}),(0,F.jsxs)(`div`,{className:`space-y-5 pt-4`,children:[(0,F.jsxs)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl`,children:[(0,F.jsxs)(`div`,{children:[(0,F.jsx)(`p`,{className:`text-[10px] uppercase font-bold text-slate-400 tracking-wider`,children:`Agreement No`}),(0,F.jsx)(`p`,{className:`text-[13px] font-semibold text-primary mt-0.5`,children:(0,F.jsx)(`code`,{children:V.agreementId})})]}),(0,F.jsxs)(`div`,{children:[(0,F.jsx)(`p`,{className:`text-[10px] uppercase font-bold text-slate-400 tracking-wider`,children:`Exchange Date`}),(0,F.jsx)(`p`,{className:`text-[13px] font-semibold text-slate-700 mt-0.5`,children:s(V.exchangeDate)})]}),(0,F.jsxs)(`div`,{className:`mt-2`,children:[(0,F.jsx)(`p`,{className:`text-[10px] uppercase font-bold text-slate-400 tracking-wider`,children:`Customer`}),(0,F.jsx)(`p`,{className:`text-[13px] font-semibold text-slate-800 mt-0.5`,children:V.customer})]}),(0,F.jsxs)(`div`,{className:`mt-2`,children:[(0,F.jsx)(`p`,{className:`text-[10px] uppercase font-bold text-slate-400 tracking-wider`,children:`Status`}),(0,F.jsx)(`div`,{className:`mt-0.5`,children:(0,F.jsx)(re,{status:V.status})})]})]}),(0,F.jsxs)(`div`,{className:`space-y-2`,children:[(0,F.jsx)(`h4`,{className:`text-[11px] font-bold uppercase tracking-wider text-slate-400`,children:`Equipment Info`}),(0,F.jsx)(`div`,{className:`border border-slate-100 rounded-xl overflow-hidden`,children:(0,F.jsxs)(ve,{children:[(0,F.jsx)(ge,{className:`bg-slate-50/50`,children:(0,F.jsxs)(M,{className:`hover:bg-transparent`,children:[(0,F.jsx)(j,{className:`font-semibold text-slate-500 h-9 text-[11px]`,children:`Role`}),(0,F.jsx)(j,{className:`font-semibold text-slate-500 h-9 text-[11px]`,children:`Equipment`}),(0,F.jsx)(j,{className:`font-semibold text-slate-500 h-9 text-[11px]`,children:`Serial`})]})}),(0,F.jsxs)(_e,{children:[(0,F.jsxs)(M,{className:`hover:bg-transparent`,children:[(0,F.jsx)(N,{className:`font-semibold text-red-600 text-[12px] py-2.5`,children:`Returned (Old)`}),(0,F.jsx)(N,{className:`text-[12px] text-slate-700 py-2.5`,children:V.currentEquipment}),(0,F.jsx)(N,{className:`text-[12px] py-2.5`,children:(0,F.jsx)(`code`,{children:V.currentEquipmentSerial})})]}),(0,F.jsxs)(M,{className:`hover:bg-transparent`,children:[(0,F.jsx)(N,{className:`font-semibold text-success text-[12px] py-2.5`,children:`Assigned (New)`}),(0,F.jsx)(N,{className:`text-[12px] text-slate-700 py-2.5`,children:V.newEquipment||`—`}),(0,F.jsx)(N,{className:`text-[12px] py-2.5`,children:(0,F.jsx)(`code`,{children:V.newEquipmentSerial||`—`})})]})]})]})})]}),(0,F.jsxs)(`div`,{className:`space-y-1 bg-blue-50/20 border border-blue-50/60 p-3 rounded-lg`,children:[(0,F.jsx)(`p`,{className:`text-[10px] uppercase font-bold text-slate-400 tracking-wider`,children:`Returned Device Status`}),(0,F.jsxs)(`p`,{className:`text-[12.5px] font-medium text-slate-700`,children:[`Released in inventory as `,(0,F.jsx)(`em`,{className:`font-semibold text-slate-800`,children:V.releaseCondition===`UnderMaintance`||V.releaseCondition===`UnderMaintenance`?`Under Maintenance`:V.releaseCondition===`Returned to Owner`?`Returned to Owner`:`Available`})]})]}),(V.ownerName||V.sourcingStatus)&&(0,F.jsxs)(`div`,{className:`space-y-1 bg-amber-50/30 border border-amber-100/60 p-3 rounded-lg`,children:[(0,F.jsx)(`p`,{className:`text-[10px] uppercase font-bold text-amber-600 tracking-wider`,children:`Owner Exchange Info`}),V.ownerName&&(0,F.jsxs)(`p`,{className:`text-[12.5px] font-medium text-slate-700`,children:[`Owner: `,(0,F.jsx)(`strong`,{children:V.ownerName})]}),V.sourcingStatus&&(0,F.jsxs)(`p`,{className:`text-[12px] text-slate-600`,children:[`Sourcing: `,(0,F.jsx)(`strong`,{children:V.sourcingStatus===`NeedFromOwner`?`🔄 Need to Collect from Owner First`:`✅ Gave from Our Stock Directly`})]})]}),(0,F.jsxs)(`div`,{className:`space-y-1`,children:[(0,F.jsx)(`p`,{className:`text-[10px] uppercase font-bold text-slate-400 tracking-wider`,children:`Reason for Exchange`}),(0,F.jsx)(`p`,{className:`text-[13px] bg-slate-50 p-3 rounded-xl border border-slate-100/60 text-slate-700 leading-normal`,children:V.reason||`No reason specified.`})]}),(0,F.jsxs)(me,{className:`border-t border-slate-100 pt-4 flex gap-2 justify-end`,children:[(0,F.jsxs)(v,{variant:`outline`,onClick:()=>ut(V),className:`h-10 rounded-lg text-[13px] border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer`,children:[(0,F.jsx)(ue,{className:`h-4 w-4`}),` Print Exchange Slip`]}),(0,F.jsx)(fe,{asChild:!0,children:(0,F.jsx)(v,{variant:`outline`,className:`h-10 rounded-lg text-[13px] border-slate-200 hover:bg-slate-50 cursor-pointer`,children:`Close`})})]})]})]})}),(0,F.jsx)(be,{exchange:Te,equipmentList:I,open:!!Te,onOpenChange:e=>!e&&Ee(null),onComplete:Qe})]})}function be({exchange:t,equipmentList:n,open:r,onOpenChange:i,onComplete:a}){let[o,ee]=(0,P.useState)(``),[s,c]=(0,P.useState)(``),[te,l]=(0,P.useState)(``),[u,d]=(0,P.useState)(!1);(0,P.useEffect)(()=>{if(o){let e=n.find(e=>e.id===o);e&&(c(e.name),l(e.serial||``))}else c(``),l(``)},[o,n]);let f=(()=>{if(!t||!n)return null;let e=n.find(e=>e.id===t.currentEquipmentId);return e?e.category:null})(),p=n.filter(e=>{let t=String(e.status||``).trim().toLowerCase()===`available`,n=!f||e.category===f;return t&&n});return t?(0,F.jsx)(T,{open:r,onOpenChange:i,children:(0,F.jsxs)(x,{className:`max-w-md bg-white border border-slate-100 rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]`,children:[(0,F.jsx)(he,{className:`border-b border-slate-100 pb-3`,children:(0,F.jsxs)(de,{className:`text-lg font-bold text-slate-900 flex items-center gap-2`,children:[(0,F.jsx)(_,{className:`h-5 w-5 text-success`}),` Complete Exchange Request`]})}),(0,F.jsxs)(`div`,{className:`space-y-4 pt-4`,children:[(0,F.jsxs)(`div`,{className:`bg-slate-50 p-4 rounded-xl space-y-2 text-[13px] text-slate-700`,children:[(0,F.jsxs)(`p`,{children:[(0,F.jsx)(`strong`,{children:`Exchange ID:`}),` `,(0,F.jsx)(`code`,{children:t.id})]}),(0,F.jsxs)(`p`,{children:[(0,F.jsx)(`strong`,{children:`Customer:`}),` `,t.customer,` (`,(0,F.jsx)(`code`,{children:t.agreementId}),`)`]}),(0,F.jsxs)(`p`,{children:[(0,F.jsx)(`strong`,{children:`Returned Item:`}),` `,t.currentEquipment,` (Sr: `,(0,F.jsx)(`code`,{children:t.currentEquipmentSerial}),`)`]}),f&&(0,F.jsxs)(`p`,{children:[(0,F.jsx)(`strong`,{children:`Category:`}),` `,(0,F.jsx)(`span`,{className:`font-semibold text-primary`,children:f})]})]}),(0,F.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,F.jsx)(y,{className:`text-[11px] font-bold uppercase tracking-wider text-slate-500`,children:`Select Replacement Equipment (In-Stock)`}),(0,F.jsx)(se,{options:p.map(e=>({value:e.id,label:e.serial?`${e.name} — ${e.serial}`:e.name})),value:o,onValueChange:ee,placeholder:`Select available replacement item...`,searchPlaceholder:`Search available inventory...`}),p.length===0&&(0,F.jsxs)(`p`,{className:`text-[11px] text-destructive font-medium`,children:[`No items available in this category (`,f||`N/A`,`)`]})]})]}),(0,F.jsxs)(me,{className:`border-t border-slate-100 pt-4 flex gap-2 justify-end mt-4`,children:[(0,F.jsx)(fe,{asChild:!0,children:(0,F.jsx)(v,{variant:`outline`,className:`h-10 rounded-lg text-[13px]`,children:`Cancel`})}),(0,F.jsx)(v,{onClick:()=>{if(!o){O.error(`Please select a replacement equipment item.`);return}d(!0),e({...t,newEquipmentId:o,newEquipment:s,newEquipmentSerial:te,releaseCondition:t.releaseCondition||`UnderMaintenance`,status:`Completed`}),O.success(`Exchange ${t.id} successfully completed!`),d(!1),i(!1),a()},disabled:u||!o,className:`h-10 px-5 bg-success hover:bg-success/90 text-white rounded-lg text-[13px] font-semibold border-0`,children:`Confirm & Complete`})]})]})}):null}export{I as component};