var e=Object.create,t=Object.defineProperty,n=Object.getOwnPropertyDescriptor,r=Object.getOwnPropertyNames,i=Object.getPrototypeOf,a=Object.prototype.hasOwnProperty,o=(e,t)=>()=>(t||(e((t={exports:{}}).exports,t),e=null),t.exports),s=(e,n)=>{let r={};for(var i in e)t(r,i,{get:e[i],enumerable:!0});return n||t(r,Symbol.toStringTag,{value:`Module`}),r},c=(e,i,o,s)=>{if(i&&typeof i==`object`||typeof i==`function`)for(var c=r(i),l=0,u=c.length,d;l<u;l++)d=c[l],!a.call(e,d)&&d!==o&&t(e,d,{get:(e=>i[e]).bind(null,d),enumerable:!(s=n(i,d))||s.enumerable});return e},l=(n,r,a)=>(a=n==null?{}:e(i(n)),c(r||!n||!n.__esModule?t(a,`default`,{value:n,enumerable:!0}):a,n)),u=o((e=>{var t=Symbol.for(`react.transitional.element`),n=Symbol.for(`react.portal`),r=Symbol.for(`react.fragment`),i=Symbol.for(`react.strict_mode`),a=Symbol.for(`react.profiler`),o=Symbol.for(`react.consumer`),s=Symbol.for(`react.context`),c=Symbol.for(`react.forward_ref`),l=Symbol.for(`react.suspense`),u=Symbol.for(`react.memo`),d=Symbol.for(`react.lazy`),f=Symbol.for(`react.activity`),p=Symbol.iterator;function m(e){return typeof e!=`object`||!e?null:(e=p&&e[p]||e[`@@iterator`],typeof e==`function`?e:null)}var h={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},g=Object.assign,_={};function v(e,t,n){this.props=e,this.context=t,this.refs=_,this.updater=n||h}v.prototype.isReactComponent={},v.prototype.setState=function(e,t){if(typeof e!=`object`&&typeof e!=`function`&&e!=null)throw Error(`takes an object of state variables to update or a function which returns an object of state variables.`);this.updater.enqueueSetState(this,e,t,`setState`)},v.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,`forceUpdate`)};function y(){}y.prototype=v.prototype;function b(e,t,n){this.props=e,this.context=t,this.refs=_,this.updater=n||h}var x=b.prototype=new y;x.constructor=b,g(x,v.prototype),x.isPureReactComponent=!0;var S=Array.isArray;function C(){}var w={H:null,A:null,T:null,S:null},T=Object.prototype.hasOwnProperty;function E(e,n,r){var i=r.ref;return{$$typeof:t,type:e,key:n,ref:i===void 0?null:i,props:r}}function D(e,t){return E(e.type,t,e.props)}function O(e){return typeof e==`object`&&!!e&&e.$$typeof===t}function k(e){var t={"=":`=0`,":":`=2`};return`$`+e.replace(/[=:]/g,function(e){return t[e]})}var A=/\/+/g;function j(e,t){return typeof e==`object`&&e&&e.key!=null?k(``+e.key):t.toString(36)}function M(e){switch(e.status){case`fulfilled`:return e.value;case`rejected`:throw e.reason;default:switch(typeof e.status==`string`?e.then(C,C):(e.status=`pending`,e.then(function(t){e.status===`pending`&&(e.status=`fulfilled`,e.value=t)},function(t){e.status===`pending`&&(e.status=`rejected`,e.reason=t)})),e.status){case`fulfilled`:return e.value;case`rejected`:throw e.reason}}throw e}function N(e,r,i,a,o){var s=typeof e;(s===`undefined`||s===`boolean`)&&(e=null);var c=!1;if(e===null)c=!0;else switch(s){case`bigint`:case`string`:case`number`:c=!0;break;case`object`:switch(e.$$typeof){case t:case n:c=!0;break;case d:return c=e._init,N(c(e._payload),r,i,a,o)}}if(c)return o=o(e),c=a===``?`.`+j(e,0):a,S(o)?(i=``,c!=null&&(i=c.replace(A,`$&/`)+`/`),N(o,r,i,``,function(e){return e})):o!=null&&(O(o)&&(o=D(o,i+(o.key==null||e&&e.key===o.key?``:(``+o.key).replace(A,`$&/`)+`/`)+c)),r.push(o)),1;c=0;var l=a===``?`.`:a+`:`;if(S(e))for(var u=0;u<e.length;u++)a=e[u],s=l+j(a,u),c+=N(a,r,i,s,o);else if(u=m(e),typeof u==`function`)for(e=u.call(e),u=0;!(a=e.next()).done;)a=a.value,s=l+j(a,u++),c+=N(a,r,i,s,o);else if(s===`object`){if(typeof e.then==`function`)return N(M(e),r,i,a,o);throw r=String(e),Error(`Objects are not valid as a React child (found: `+(r===`[object Object]`?`object with keys {`+Object.keys(e).join(`, `)+`}`:r)+`). If you meant to render a collection of children, use an array instead.`)}return c}function P(e,t,n){if(e==null)return e;var r=[],i=0;return N(e,r,``,``,function(e){return t.call(n,e,i++)}),r}function F(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(t){(e._status===0||e._status===-1)&&(e._status=1,e._result=t)},function(t){(e._status===0||e._status===-1)&&(e._status=2,e._result=t)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var ee=typeof reportError==`function`?reportError:function(e){if(typeof window==`object`&&typeof window.ErrorEvent==`function`){var t=new window.ErrorEvent(`error`,{bubbles:!0,cancelable:!0,message:typeof e==`object`&&e&&typeof e.message==`string`?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process==`object`&&typeof process.emit==`function`){process.emit(`uncaughtException`,e);return}console.error(e)},te={map:P,forEach:function(e,t,n){P(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return P(e,function(){t++}),t},toArray:function(e){return P(e,function(e){return e})||[]},only:function(e){if(!O(e))throw Error(`React.Children.only expected to receive a single React element child.`);return e}};e.Activity=f,e.Children=te,e.Component=v,e.Fragment=r,e.Profiler=a,e.PureComponent=b,e.StrictMode=i,e.Suspense=l,e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=w,e.__COMPILER_RUNTIME={__proto__:null,c:function(e){return w.H.useMemoCache(e)}},e.cache=function(e){return function(){return e.apply(null,arguments)}},e.cacheSignal=function(){return null},e.cloneElement=function(e,t,n){if(e==null)throw Error(`The argument must be a React element, but you passed `+e+`.`);var r=g({},e.props),i=e.key;if(t!=null)for(a in t.key!==void 0&&(i=``+t.key),t)!T.call(t,a)||a===`key`||a===`__self`||a===`__source`||a===`ref`&&t.ref===void 0||(r[a]=t[a]);var a=arguments.length-2;if(a===1)r.children=n;else if(1<a){for(var o=Array(a),s=0;s<a;s++)o[s]=arguments[s+2];r.children=o}return E(e.type,i,r)},e.createContext=function(e){return e={$$typeof:s,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null},e.Provider=e,e.Consumer={$$typeof:o,_context:e},e},e.createElement=function(e,t,n){var r,i={},a=null;if(t!=null)for(r in t.key!==void 0&&(a=``+t.key),t)T.call(t,r)&&r!==`key`&&r!==`__self`&&r!==`__source`&&(i[r]=t[r]);var o=arguments.length-2;if(o===1)i.children=n;else if(1<o){for(var s=Array(o),c=0;c<o;c++)s[c]=arguments[c+2];i.children=s}if(e&&e.defaultProps)for(r in o=e.defaultProps,o)i[r]===void 0&&(i[r]=o[r]);return E(e,a,i)},e.createRef=function(){return{current:null}},e.forwardRef=function(e){return{$$typeof:c,render:e}},e.isValidElement=O,e.lazy=function(e){return{$$typeof:d,_payload:{_status:-1,_result:e},_init:F}},e.memo=function(e,t){return{$$typeof:u,type:e,compare:t===void 0?null:t}},e.startTransition=function(e){var t=w.T,n={};w.T=n;try{var r=e(),i=w.S;i!==null&&i(n,r),typeof r==`object`&&r&&typeof r.then==`function`&&r.then(C,ee)}catch(e){ee(e)}finally{t!==null&&n.types!==null&&(t.types=n.types),w.T=t}},e.unstable_useCacheRefresh=function(){return w.H.useCacheRefresh()},e.use=function(e){return w.H.use(e)},e.useActionState=function(e,t,n){return w.H.useActionState(e,t,n)},e.useCallback=function(e,t){return w.H.useCallback(e,t)},e.useContext=function(e){return w.H.useContext(e)},e.useDebugValue=function(){},e.useDeferredValue=function(e,t){return w.H.useDeferredValue(e,t)},e.useEffect=function(e,t){return w.H.useEffect(e,t)},e.useEffectEvent=function(e){return w.H.useEffectEvent(e)},e.useId=function(){return w.H.useId()},e.useImperativeHandle=function(e,t,n){return w.H.useImperativeHandle(e,t,n)},e.useInsertionEffect=function(e,t){return w.H.useInsertionEffect(e,t)},e.useLayoutEffect=function(e,t){return w.H.useLayoutEffect(e,t)},e.useMemo=function(e,t){return w.H.useMemo(e,t)},e.useOptimistic=function(e,t){return w.H.useOptimistic(e,t)},e.useReducer=function(e,t,n){return w.H.useReducer(e,t,n)},e.useRef=function(e){return w.H.useRef(e)},e.useState=function(e){return w.H.useState(e)},e.useSyncExternalStore=function(e,t,n){return w.H.useSyncExternalStore(e,t,n)},e.useTransition=function(){return w.H.useTransition()},e.version=`19.2.7`})),d=o(((e,t)=>{t.exports=u()})),f=l(d(),1),p=typeof window<`u`;function m(){return p?localStorage.getItem(`medirent-gsheets-url`)||`https://script.google.com/macros/s/AKfycbwGtMZHfNnAoEsbRIUsNZVmOTotRmChnaXsxPbEqih05-YitjF3skHYQdxcxAYR5KPGFA/exec`:``}function h(e){p&&localStorage.setItem(`medirent-gsheets-url`,e)}function g(){let e=m();return!!e&&e.startsWith(`https://script.google.com/`)}async function _(e,t){let n=m();if(!n)return{success:!1,error:`No Apps Script URL configured`};try{let r=await fetch(n,{method:`POST`,headers:{"Content-Type":`text/plain;charset=utf-8`},body:JSON.stringify({action:e,...t}),keepalive:!0});if(!r.ok)throw Error(`HTTP error ${r.status}`);let i=await r.text(),a;try{a=JSON.parse(i)}catch{return{success:!0,data:i}}return a&&a.error?{success:!1,error:a.error}:{success:!0,data:a}}catch(e){return console.warn(`[GSheets] Request failed:`,e),{success:!1,error:e instanceof Error?e.message:String(e)}}}async function v(e,t){let n=m();if(!n)return{success:!1,error:`No Apps Script URL configured`};try{let r=`${n}?action=getAll&sheet=${encodeURIComponent(e)}`;t&&(r+=`&filterKey=${encodeURIComponent(t.key)}&filterValue=${encodeURIComponent(t.value)}`);let i=await fetch(r,{method:`GET`});if(!i.ok)throw Error(`HTTP ${i.status}`);return{success:!0,data:(await i.json()).data||[]}}catch(e){return console.warn(`[GSheets] GET failed:`,e),{success:!1,error:String(e)}}}async function y(){let e=m();if(!e)return{ok:!1,message:`No URL configured`};if(!e.startsWith(`https://script.google.com/`))return{ok:!1,message:`URL must start with https://script.google.com/`};try{let t=`${e}?action=ping`,n=await fetch(t,{method:`GET`});if(!n.ok)throw Error(`HTTP ${n.status}`);let r=await n.json();if(r.status===`ok`)return{ok:!0,message:`Connected! Sheet: "${r.sheetName||`Unknown`}"`};throw Error(r.error||`Unknown error`)}catch(e){return{ok:!1,message:`Connection failed: ${String(e)}`}}}function b(){if(!p)return[];try{return JSON.parse(localStorage.getItem(`medirent-pending-syncs`)||`[]`)}catch{return[]}}function x(e){p&&localStorage.setItem(`medirent-pending-syncs`,JSON.stringify(e))}function S(e,t,n,r){let i=b().filter(e=>!(e.sheet===t&&e.id===n));i.push({type:e,sheet:t,id:n,data:r,timestamp:Date.now()}),x(i)}function C(e,t){x(b().filter(n=>!(n.sheet===e&&n.id===t)))}function w(){let e=b(),t=Date.now();x(e.filter(e=>t-e.timestamp<12e4))}function T(e,t){if(!t||!t.id)return;let n=String(t.id);S(`upsert`,e,n,t);let r=t;if(t&&t.fileData){let{fileData:e,...n}=t;r=n}_(`upsert`,{sheet:e,row:r}).then(t=>{t.success&&C(e,n)}).catch(t=>{console.warn(`[GSheets] Upsert sync failed for ${e}/${n}:`,t)})}function E(e,t){S(`delete`,e,t),_(`delete`,{sheet:e,id:t}).then(n=>{n.success&&C(e,t)}).catch(n=>{console.warn(`[GSheets] Delete sync failed for ${e}/${t}:`,n)})}async function D(e){let t=m();if(!t)return{success:!1,sheetsWritten:[],errors:[`No URL configured`]};let n=[],r=[],i={...e};for(let e of Object.keys(i))i[e]=i[e].map(e=>{if(e&&e.fileData){let{fileData:t,...n}=e;return n}return e});for(let[e,a]of Object.entries(i))try{let r=await fetch(t,{method:`POST`,headers:{"Content-Type":`text/plain;charset=utf-8`},body:JSON.stringify({action:`bulkUpsert`,sheet:e,rows:a})});if(!r.ok)throw Error(`HTTP error ${r.status}`);let i=await r.text(),o;try{o=JSON.parse(i)}catch{}if(o&&o.error)throw Error(o.error);n.push(e)}catch(t){r.push(`${e}: ${t instanceof Error?t.message:String(t)}`)}return{success:r.length===0,sheetsWritten:n,errors:r}}async function O(e,t){let n=await v(e,t);return n.success?(n.data||[]).map(e=>{let t={...e};for(let e of Object.keys(t)){let n=t[e];if(typeof n==`string`){let r=n.trim();if(r.startsWith(`[`)&&r.endsWith(`]`)||r.startsWith(`{`)&&r.endsWith(`}`))try{t[e]=JSON.parse(r)}catch{}}}return t}):(console.warn(`[GSheets] Failed to read sheet data for ${e}:`,n.error),null)}var k={CUSTOMERS:`Customers`,EQUIPMENT:`Equipment`,RENTALS:`Rentals`,PAYMENTS:`Payments`,RETURNS:`Returns`,OWNERS:`Owners`,DOCUMENTS:`Documents`,EXCHANGES:`Exchanges`,FILE_CHUNKS:`FileChunks`,STAFF:`Staff`,SETTINGS:`Settings`};async function A(e,t){let n=m();if(!n)return{success:!1,error:`No Apps Script URL configured`};try{let r=`${n}?action=sendOtp&email=${encodeURIComponent(e)}&otp=${encodeURIComponent(t)}`,i=await fetch(r,{method:`GET`});if(!i.ok)throw Error(`HTTP error ${i.status}`);let a=await i.text(),o;try{o=JSON.parse(a)}catch{return{success:!0}}return o&&o.error?{success:!1,error:o.error}:{success:!0}}catch(e){return console.warn(`[GSheets] sendOtpEmail failed:`,e),{success:!1,error:e instanceof Error?e.message:String(e)}}}async function j(e){let t=await _(`clearSheet`,{sheet:e});return{success:t.success,error:t.error}}Array.from({length:12}).map((e,t)=>({month:[`Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`][t],current:32e4+Math.round(Math.sin(t/2)*9e4)+t*22e3,previous:28e4+Math.round(Math.cos(t/2)*6e4)+t*16e3})),Array.from({length:12}).map((e,t)=>({month:[`Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`][t],newRentals:180+Math.round(Math.sin(t/2.5)*40)+t*8,returns:140+Math.round(Math.cos(t/2.5)*30)+t*5})),Array.from({length:7}).map((e,t)=>({day:[`Mon`,`Tue`,`Wed`,`Thu`,`Fri`,`Sat`,`Sun`][t],collected:4e4+t*7e3+Math.round(Math.sin(t)*12e3),pending:1e4+t*2e3+Math.round(Math.cos(t)*5e3)}));var M=[],N=[],P=[],F=[],ee=[],te=s({EQUIPMENT_CATEGORIES:()=>ie,PRICING_TABLE:()=>ut,approveRental:()=>Re,calculateCustomerStatus:()=>he,cancelRental:()=>Le,cleanNum:()=>Q,dataURLtoBlob:()=>at,deleteCustomer:()=>_e,deleteDocument:()=>Fe,deleteEquipment:()=>ye,deleteFileChunks:()=>Me,deleteFileFromIndexedDB:()=>Ee,deleteOwner:()=>Se,deletePayment:()=>Be,downloadAgreementFile:()=>Qe,downloadBase64File:()=>ot,downloadExcel:()=>Ze,downloadFile:()=>Xe,downloadFileChunks:()=>je,extractIdNumber:()=>ae,formatDateDDMMYYYY:()=>ne,getAgreementHtmlContent:()=>$e,getAllDataForSync:()=>Ke,getCompanySettings:()=>Je,getCustomerDueBalance:()=>He,getCustomers:()=>V,getDocumentPreviewUrl:()=>it,getDocumentWithFile:()=>De,getDocuments:()=>q,getDynamicKPIs:()=>Ge,getEquipment:()=>H,getExchanges:()=>$,getFileFromIndexedDB:()=>K,getLocalYYYYMMDD:()=>re,getNextAgreementNumber:()=>oe,getNextCustomerNumber:()=>de,getNextDocumentNumber:()=>fe,getNextEquipmentNumber:()=>me,getNextExchangeNumber:()=>ht,getNextOwnerNumber:()=>pe,getNextPaymentNumber:()=>ue,getNextReturnNumber:()=>ce,getOwners:()=>U,getPaidForEquipment:()=>pt,getPayments:()=>Y,getPricingTableRate:()=>dt,getRentals:()=>J,getReturnCalculatedRentPerItem:()=>ft,getReturnReceiptHtmlContent:()=>nt,getReturns:()=>X,parseLocalDate:()=>L,peekNextAgreementNumber:()=>se,peekNextExchangeNumber:()=>gt,peekNextReturnNumber:()=>le,printAgreement:()=>et,printDocumentFile:()=>st,printReceipt:()=>tt,printReturnReceipt:()=>rt,saveCompanySettings:()=>Ye,saveCustomer:()=>ge,saveDocument:()=>Ne,saveEquipment:()=>ve,saveExchange:()=>_t,saveOwner:()=>xe,savePayment:()=>ze,saveRental:()=>Ie,saveReturn:()=>Ve,setFileInIndexedDB:()=>G,sortLatestFirst:()=>R,syncFromSheetsToLocalStorage:()=>lt,syncMissingFileChunks:()=>ct,uploadFileChunks:()=>Ae,useDatabaseTrigger:()=>vt}),I=typeof window<`u`;if(I&&localStorage.getItem(`medirent-db-cleared-v9`)!==`true`){let e=localStorage.getItem(`medirent-staff-users`);localStorage.removeItem(`medirent-customers`),localStorage.removeItem(`medirent-equipment`),localStorage.removeItem(`medirent-rentals`),localStorage.removeItem(`medirent-payments`),localStorage.removeItem(`medirent-returns`),localStorage.removeItem(`medirent-documents`),localStorage.removeItem(`medirent-owners`),localStorage.removeItem(`medirent-exchanges`),localStorage.removeItem(`medirent-db-cleared-v8`),e&&localStorage.setItem(`medirent-staff-users`,e),localStorage.setItem(`medirent-db-cleared-v9`,`true`)}if(I){let e=localStorage.getItem(`medirent-staff-users`),t=[];if(e)try{t=JSON.parse(e),Array.isArray(t)||(t=[])}catch{t=[]}let n={id:`1`,name:`Relife Admin`,email:`relifemedicaltechnologies.mys@gmail.com`,passwordHash:`2d8b2a1ff89a8b02e74a88a7fba7304e1724aa45324dd82ce7da2f9d4d3b0cec`,role:`Admin`,firstAdmin:!0},r=t.findIndex(e=>e.email===`g.avinash10005@gmail.com`||e.id===`1`||e.firstAdmin);r>-1?t[r]=n:t.some(e=>e.email.toLowerCase()===n.email)||t.unshift(n),localStorage.setItem(`medirent-staff-users`,JSON.stringify(t)),localStorage.setItem(`medirent-setup-done`,`true`)}if(I)try{let e=localStorage.getItem(`medirent-rentals`);if(e){let t=JSON.parse(e),n=new Date;n.setHours(0,0,0,0);let r=!1;t.forEach(e=>{if(e.status===`Active`&&e.end){let t=new Date(e.end);t.setHours(0,0,0,0),!isNaN(t.getTime())&&t<n&&(e.status=`Overdue`,r=!0)}}),r&&localStorage.setItem(`medirent-rentals`,JSON.stringify(t))}}catch{}function ne(e){if(!e)return`—`;if(/^\d{2}-\d{2}-\d{4}$/.test(e))return e;if(e.includes(`T`)){let t=new Date(e);if(!isNaN(t.getTime()))return`${String(t.getDate()).padStart(2,`0`)}-${String(t.getMonth()+1).padStart(2,`0`)}-${t.getFullYear()}`}let t=e.split(`T`)[0].split(/[-/]/);if(t.length===3&&t[0].length===4){let[e,n,r]=t;return`${r.padStart(2,`0`)}-${n.padStart(2,`0`)}-${e}`}let n=new Date(e);return isNaN(n.getTime())?e:`${String(n.getDate()).padStart(2,`0`)}-${String(n.getMonth()+1).padStart(2,`0`)}-${n.getFullYear()}`}function re(e=new Date){if(typeof e==`string`){let t=e.trim();if(/^\d{4}-\d{2}-\d{2}$/.test(t))return t;let n=new Date(t);return isNaN(n.getTime())?t.split(`T`)[0]:`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,`0`)}-${String(n.getDate()).padStart(2,`0`)}`}return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`}function L(e){if(!e)return new Date(NaN);if(typeof e==`string`&&e.includes(`T`)){let t=new Date(e);if(!isNaN(t.getTime()))return new Date(t.getFullYear(),t.getMonth(),t.getDate())}let t=e.split(`T`)[0].trim(),n=t.split(/[-/]/);if(n.length===3){let e=parseInt(n[0],10),t=parseInt(n[1],10)-1,r=parseInt(n[2],10);if(n[2].length===4&&(e=parseInt(n[2],10),r=parseInt(n[0],10)),!isNaN(e)&&!isNaN(t)&&!isNaN(r))return new Date(e,t,r)}return new Date(t)}var ie=[`Oxygen Concentrator 5LP`,`Oxygen Concentrator 10LPM`,`Bipap Machine`,`Auto CPAP Machine`,`Surgical Cot With Mattress`,`Foldable Wheel Chair`,`Patient Monitor`,`Syringe Pump`,`Infusion Pump`,`Nebulizer`,`Patient Ventilator`];function ae(e){if(!e)return 0;let t=e.match(/\d+/g);return t?parseInt(t.join(``),10):0}function R(e,t){return Array.isArray(e)?[...e].sort((e,n)=>{let r=e?.id||e?.agreementId||e?.rentalId||``,i=n?.id||n?.agreementId||n?.rentalId||``,a=ae(r),o=ae(i);if(a!==o)return o-a;if(t&&e?.[t]&&n?.[t]){let r=L(e[t]).getTime(),i=L(n[t]).getTime();if(!isNaN(r)&&!isNaN(i)&&r!==i)return i-r}return(i||``).localeCompare(r||``)}):[]}function oe(){if(!I)return`AGR-${new Date().getFullYear()}-0001`;let e=new Date().getFullYear(),t=`medirent-agr-counter-${e}`,n=J(),r=`AGR-${e}-`,i=0;n.forEach(e=>{if(e.id&&e.id.startsWith(r)){let t=e.id.split(`-`),n=parseInt(t[t.length-1],10);!isNaN(n)&&n>i&&(i=n)}});let a=i+1;return localStorage.setItem(t,a.toString()),`AGR-${e}-${String(a).padStart(4,`0`)}`}function se(){if(!I)return`AGR-${new Date().getFullYear()}-0001`;let e=new Date().getFullYear(),t=J(),n=`AGR-${e}-`,r=0;return t.forEach(e=>{if(e.id&&e.id.startsWith(n)){let t=e.id.split(`-`),n=parseInt(t[t.length-1],10);!isNaN(n)&&n>r&&(r=n)}}),`AGR-${e}-${String(r+1).padStart(4,`0`)}`}function ce(){if(!I)return`RET-0001`;let e=`medirent-ret-counter`,t=z(`medirent-returns`,[]),n=parseInt(localStorage.getItem(e)||`0`,10);t.forEach(e=>{if(e.id&&e.id.startsWith(`RET-`)){let t=e.id.split(`-`),r=parseInt(t[t.length-1],10);!isNaN(r)&&r>n&&(n=r)}});let r=n+1;return localStorage.setItem(e,r.toString()),`RET-${String(r).padStart(4,`0`)}`}function le(){if(!I)return`RET-0001`;let e=z(`medirent-returns`,[]),t=parseInt(localStorage.getItem(`medirent-ret-counter`)||`0`,10);return e.forEach(e=>{if(e.id&&e.id.startsWith(`RET-`)){let n=e.id.split(`-`),r=parseInt(n[n.length-1],10);!isNaN(r)&&r>t&&(t=r)}}),`RET-${String(t+1).padStart(4,`0`)}`}function ue(){if(!I)return`PAY-0001`;let e=`medirent-pay-counter`,t=z(`medirent-payments`,[]),n=parseInt(localStorage.getItem(e)||`0`,10);t.forEach(e=>{if(e.id&&e.id.startsWith(`PAY-`)){let t=e.id.split(`-`),r=parseInt(t[t.length-1],10);!isNaN(r)&&r>n&&(n=r)}});let r=n+1;return localStorage.setItem(e,r.toString()),`PAY-${String(r).padStart(4,`0`)}`}function de(){if(!I)return`CUS-0001`;let e=`medirent-cus-counter`,t=z(`medirent-customers`,[]),n=parseInt(localStorage.getItem(e)||`0`,10);t.forEach(e=>{if(e.id&&e.id.startsWith(`CUS-`)){let t=e.id.split(`-`),r=parseInt(t[t.length-1],10);!isNaN(r)&&r>n&&(n=r)}});let r=n+1;return localStorage.setItem(e,r.toString()),`CUS-${String(r).padStart(4,`0`)}`}function fe(){return I?`DOC-${Date.now()}-${Math.floor(Math.random()*1e3)}`:`DOC-0001`}function pe(){if(!I)return`OWN-0001`;let e=`medirent-own-counter`,t=z(`medirent-owners`,[]),n=parseInt(localStorage.getItem(e)||`0`,10);t.forEach(e=>{if(e.id&&e.id.startsWith(`OWN-`)){let t=e.id.split(`-`),r=parseInt(t[t.length-1],10);!isNaN(r)&&r>n&&(n=r)}});let r=n+1;return localStorage.setItem(e,r.toString()),`OWN-${String(r).padStart(4,`0`)}`}function me(e){let t=(e||`EQ`).substring(0,3).toUpperCase().trim();if(!I)return`EQ-${t}-0001`;let n=`medirent-eq-counter-${t}`,r=parseInt(localStorage.getItem(n)||`0`,10)+1;return localStorage.setItem(n,r.toString()),`EQ-${t}-${String(r).padStart(4,`0`)}`}function z(e,t){if(!I)return t;let n=localStorage.getItem(e);if(!n)return localStorage.setItem(e,JSON.stringify(t)),t;try{return JSON.parse(n)}catch{return t}}function B(e,t){I&&(localStorage.setItem(e,JSON.stringify(t)),e!==`medirent-last-write-time`&&e!==`medirent-gsheets-url`&&(localStorage.setItem(`medirent-last-write-time`,Date.now().toString()),window.dispatchEvent(new Event(`medirent-db-updated`))))}function he(e,t){let n=t.filter(t=>t.customerId===e.id),r=n.some(e=>e.status===`Overdue`),i=n.some(e=>e.status===`Active`),a=n.some(e=>e.status===`Completed`);return r?`Overdue`:i||a||e.aadhaar||e.pan?`Active`:`Pending`}function V(){let e=z(`medirent-customers`,M);if(typeof window>`u`)return R(e);let t=J(),n=!1,r=e.map(e=>{let r=t.filter(t=>t.customerId===e.id&&(t.status===`Active`||t.status===`Overdue`)).length,i=he(e,t);return(e.rentals!==r||e.status!==i)&&(e.rentals=r,e.status=i,n=!0),e});return n&&localStorage.setItem(`medirent-customers`,JSON.stringify(r)),R(r)}function ge(e){let t=V(),n=t.findIndex(t=>t.id===e.id);return n>-1?t[n]=e:t.unshift(e),B(`medirent-customers`,t),g()&&T(k.CUSTOMERS,e),t}function _e(e){let t=V().filter(t=>t.id!==e);return B(`medirent-customers`,t),g()&&E(k.CUSTOMERS,e),t}function H(){let e=z(`medirent-equipment`,N);if(typeof window>`u`)return R(e,`purchaseDate`);let t=J(),n=!1,r=e.map(e=>{let r=t.some(t=>t.status!==`Active`&&t.status!==`Overdue`?!1:t.equipmentItems&&t.equipmentItems.length>0?t.equipmentItems.some(t=>t.equipmentId===e.id&&!t.returned):(t.equipmentId||``).split(`,`).map(e=>e.trim()).filter(Boolean).includes(e.id)),i=e.status;return r?i=`Rented`:e.status===`Rented`&&(i=`Available`),e.status!==i&&(e.status=i,n=!0),e});return n&&localStorage.setItem(`medirent-equipment`,JSON.stringify(r)),R(r,`purchaseDate`)}function ve(e){e.status||=`Available`;let t=z(`medirent-equipment`,N),n=t.findIndex(t=>t.id===e.id);return n>-1?t[n]=e:t.unshift(e),B(`medirent-equipment`,t),g()&&T(k.EQUIPMENT,e),t}function ye(e){let t=z(`medirent-equipment`,N).filter(t=>t.id!==e);return B(`medirent-equipment`,t),g()&&E(k.EQUIPMENT,e),t}var be=[];function U(){let e=z(`medirent-owners`,be),t=z(`medirent-equipment`,N),n=!1,r=e.map(e=>{let r=t.filter(t=>t.owner?.toLowerCase()===e.name.toLowerCase()).some(e=>e.status===`Rented`)?`Active`:`Inactive`;return e.status!==r&&(e.status=r,n=!0),e});return n&&localStorage.setItem(`medirent-owners`,JSON.stringify(r)),R(r)}function xe(e){let t=U(),n=t.findIndex(t=>t.id===e.id);return n>-1?t[n]=e:t.unshift(e),B(`medirent-owners`,t),g()&&T(k.OWNERS,e),t}function Se(e){let t=U().filter(t=>t.id!==e);return B(`medirent-owners`,t),g()&&E(k.OWNERS,e),t}var Ce=`medirent-files-db`,we=1,W=`files`;function Te(){return new Promise((e,t)=>{if(typeof window>`u`||!window.indexedDB){t(Error(`IndexedDB not supported in this environment`));return}let n=indexedDB.open(Ce,we);n.onupgradeneeded=e=>{let t=n.result;t.objectStoreNames.contains(W)||t.createObjectStore(W)},n.onsuccess=()=>e(n.result),n.onerror=()=>t(n.error)})}function G(e,t){return typeof window>`u`||!window.indexedDB?Promise.resolve():Te().then(n=>new Promise((r,i)=>{let a=n.transaction(W,`readwrite`).objectStore(W).put(t,e);a.onsuccess=()=>r(),a.onerror=()=>i(a.error)}))}function K(e){return typeof window>`u`||!window.indexedDB?Promise.resolve(void 0):Te().then(t=>new Promise((n,r)=>{let i=t.transaction(W,`readonly`).objectStore(W).get(e);i.onsuccess=()=>n(i.result),i.onerror=()=>r(i.error)})).catch(()=>void 0)}function Ee(e){return typeof window>`u`||!window.indexedDB?Promise.resolve():Te().then(t=>new Promise((n,r)=>{let i=t.transaction(W,`readwrite`).objectStore(W).delete(e);i.onsuccess=()=>n(),i.onerror=()=>r(i.error)})).catch(()=>{})}async function De(e){if(e.fileData)return e;let t=await K(e.id);if(t)return{...e,fileData:t};if(g())try{let t=await je(e.id);if(t)return await G(e.id,t),{...e,fileData:t}}catch(t){console.warn(`[GSheets] Failed to download file chunks for ${e.id}:`,t)}return{...e,fileData:`NOT_FOUND`}}var Oe=[];function q(){let e=z(`medirent-documents`,Oe),t=e.find(e=>e.name===`QR_Code_741852.png`);t&&(e=e.filter(e=>e.name!==`QR_Code_741852.png`),B(`medirent-documents`,e),Ee(t.id));let n=!1;return e=e.map(e=>{if(e.type===`Location Tag`&&(e.name===`Location_Tag_.txt`||e.name.includes(`undefined`)||!e.rentalId)){let t=z(`medirent-rentals`,[]).find(t=>t.customerId===e.customerId);t&&(e.rentalId=t.id,e.name=`Location_Tag_${t.id}.txt`,n=!0)}if(e.type===`Delivery Photo`&&(e.name===`Delivery_Photo_.jpg`||e.name.includes(`undefined`)||!e.rentalId)){let t=z(`medirent-rentals`,[]).find(t=>t.customerId===e.customerId);t&&(e.rentalId=t.id,e.name=`Delivery_Photo_${t.id}.jpg`,n=!0)}return e.fileData&&(G(e.id,e.fileData),delete e.fileData,n=!0),e}),n&&localStorage.setItem(`medirent-documents`,JSON.stringify(e)),R(e,`date`)}var ke=45e3;async function Ae(e,t){if(!g())return!1;let n=Math.ceil(t.length/ke);try{for(let r=0;r<n;r++){let i=t.substring(r*ke,(r+1)*ke),a={id:`${e}_chunk_${r}`,fileId:e,chunkIndex:r,totalChunks:n,chunkData:i},o=!1;for(let e=0;e<3&&!o;e++)o=(await _(`upsert`,{sheet:k.FILE_CHUNKS,row:a})).success;if(!o)return console.warn(`[GSheets] Failed to upload chunk ${r+1}/${n} for ${e} after retries`),!1}return!0}catch(t){return console.warn(`[GSheets] Failed to upload file chunks for ${e}:`,t),!1}}async function je(e){if(!g())return null;let t=await O(k.FILE_CHUNKS,{key:`fileId`,value:e});if(!t)return null;let n=t.filter(t=>t.fileId===e).sort((e,t)=>e.chunkIndex-t.chunkIndex);if(n.length===0)return null;let r=Number(n[0].totalChunks);if(!r||n.length!==r)return console.warn(`[GSheets] Incomplete file chunks for ${e}: got ${n.length}/${r||`?`}`),null;for(let t=0;t<r;t++)if(Number(n[t].chunkIndex)!==t)return console.warn(`[GSheets] Missing chunk ${t} for ${e}`),null;return n.map(e=>e.chunkData).join(``)}async function Me(e){if(g())try{let t=await O(k.FILE_CHUNKS,{key:`fileId`,value:e});if(t){let n=t.filter(t=>t.fileId===e);for(let e of n)E(k.FILE_CHUNKS,e.id)}}catch(t){console.warn(`[GSheets] Failed to delete file chunks for ${e}:`,t)}}function Ne(e){let t=q(),n=e.fileData,r={...e};n&&(G(e.id,n),delete r.fileData);let i=t.findIndex(t=>t.id===e.id);return i>-1?t[i]=r:t.unshift(r),B(`medirent-documents`,t),g()&&(T(k.DOCUMENTS,r),n&&Ae(e.id,n)),t}function Pe(e){let t=q(),n=e.fileData,r={...e};n&&(G(e.id,n),delete r.fileData);let i=t.findIndex(t=>t.id===e.id);return i>-1?t[i]=r:t.unshift(r),localStorage.setItem(`medirent-documents`,JSON.stringify(t)),g()&&T(k.DOCUMENTS,r),t}function Fe(e){let t=q().filter(t=>t.id!==e);return B(`medirent-documents`,t),Ee(e),g()&&(E(k.DOCUMENTS,e),Me(e)),t}function J(){let e=z(`medirent-rentals`,P);if(typeof window>`u`)return R(e,`start`);let t=!1,n=X(),r=e.map(e=>{let r=!1,i=e.equipmentItems||[];if(i.length===0&&e.equipmentId){let t=e.equipmentId.split(`,`).map(e=>e.trim()).filter(Boolean),n=(e.serial||``).split(`,`).map(e=>e.trim()).filter(Boolean);i=t.map((r,i)=>({equipmentId:r,serial:n[i]||`XXXX`,monthlyRent:Q(e.monthlyRent)/t.length,deposit:Q(e.deposit)/t.length,returned:!1})),r=!0}let a=n.filter(t=>t.agreement===e.id),o=new Set(a.flatMap(e=>e.returnedEquipmentIds||[])),s=i.map(e=>o.has(e.equipmentId)&&!e.returned?(r=!0,{...e,returned:!0}):e);if(r){t=!0;let n=s.every(e=>e.returned),r=s.filter(e=>!e.returned),i=n?`Completed`:e.status,a=r.map(e=>e.equipmentId).join(`, `),o=r.map(e=>e.serial).join(`, `);return{...e,status:i,equipmentItems:s,equipmentId:a,serial:o}}return i.length>0&&!e.equipmentItems?(t=!0,{...e,equipmentItems:i}):e});return t?(localStorage.setItem(`medirent-rentals`,JSON.stringify(r)),R(r,`start`)):R(e,`start`)}function Ie(e){let t=J(),n=t.findIndex(t=>t.id===e.id);if(n>-1){let r=t[n];if(r.equipmentId){let t=r.equipmentId.split(`,`).map(e=>e.trim()).filter(Boolean),n=(e.equipmentId||``).split(`,`).map(e=>e.trim()).filter(Boolean);t.forEach(e=>{n.includes(e)||Z(e,`Available`)})}t[n]=e}else t.unshift(e);B(`medirent-rentals`,t),(e.status===`Active`||e.status===`Overdue`||e.status===`Pending Approval`)&&e.equipmentId&&e.equipmentId.split(`,`).map(e=>e.trim()).filter(Boolean).forEach(e=>{Z(e,`Rented`)}),Ue(e.customerId);let r=H(),i=new Set;return(e.equipmentId||``).split(`,`).map(e=>e.trim()).filter(Boolean).forEach(e=>{let t=r.find(t=>t.id===e);t?.owner&&i.add(t.owner)}),i.forEach(e=>We(e)),q().some(t=>t.id===`doc-agr-${e.id}`)||Pe({id:`doc-agr-${e.id}`,name:`Agreement ${e.id}.pdf`,type:`Agreement`,size:`320 KB`,date:new Date().toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`}),rentalId:e.id,customerId:e.customerId}),g()&&T(k.RENTALS,e),t}function Le(e){let t=J(),n=t.findIndex(t=>t.id===e);if(n>-1){let e=t[n];e.status=`Cancelled`,B(`medirent-rentals`,t),e.equipmentId&&e.equipmentId.split(`,`).map(e=>e.trim()).filter(Boolean).forEach(e=>{Z(e,`Available`)}),Ue(e.customerId);let r=H(),i=new Set;(e.equipmentId||``).split(`,`).map(e=>e.trim()).filter(Boolean).forEach(e=>{let t=r.find(t=>t.id===e);t?.owner&&i.add(t.owner)}),i.forEach(e=>We(e)),g()&&T(k.RENTALS,e)}return t}function Re(e){let t=J(),n=t.findIndex(t=>t.id===e);if(n>-1){let e=t[n],r=new Date;r.setHours(0,0,0,0);let i=e.end?new Date(e.end):null;i&&!isNaN(i.getTime())&&i<r?e.status=`Overdue`:e.status=`Active`,B(`medirent-rentals`,t),g()&&T(k.RENTALS,e),typeof window<`u`&&window.dispatchEvent(new CustomEvent(`medirent-db-updated`))}}function Y(){return R(z(`medirent-payments`,F),`date`)}function ze(e){let t=Y(),n=t.findIndex(t=>t.id===e.id);if(n>-1?t[n]=e:t.unshift(e),B(`medirent-payments`,t),e.agreement&&e.type===`Rent`){let t=J(),n=t.find(t=>t.id===e.agreement);n&&n.status===`Overdue`&&e.status===`Paid`&&(n.status=`Active`,localStorage.setItem(`medirent-rentals`,JSON.stringify(t)))}return q().some(t=>t.id===`doc-pay-${e.id}`)||Pe({id:`doc-pay-${e.id}`,name:`${e.type===`Deposit`?`Receipt`:`Invoice`} ${e.id}.pdf`,type:e.type===`Deposit`?`Receipt`:`Invoice`,size:`112 KB`,date:new Date().toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`}),rentalId:e.agreement,customerId:e.customerId}),g()&&T(k.PAYMENTS,e),t}function Be(e){let t=Y(),n=t.find(t=>t.id===e),r=t.filter(t=>t.id!==e);return B(`medirent-payments`,r),n?.customerId&&Ue(n.customerId),g()&&E(k.PAYMENTS,e),r}function X(){let e=z(`medirent-returns`,ee);if(typeof window>`u`)return R(e,`date`);let t=Y();return R(e.map(e=>{if(e.refund<0){let n=Math.abs(e.refund);if(e.duePaidAmount===void 0){let r=t.filter(t=>t.agreement===e.agreement&&t.status===`Paid`&&(t.notes||``).toLowerCase().includes(`return`)).reduce((e,t)=>e+(t.amount||0),0),i=e.duePaymentStatus===`Paid`?n:Math.min(n,r),a=Math.max(0,n-i),o=a<=0?`Paid`:i>0?`Partial`:`Not Paid`;return{...e,duePaidAmount:i,duePendingBalance:a,duePaymentStatus:o}}}return e}),`date`)}function Ve(e){let t=X(),n=t.findIndex(t=>t.id===e.id);n>-1?t[n]=e:t.unshift(e),B(`medirent-returns`,t);let r=J(),i=r.findIndex(t=>t.id===e.agreement),a=``;if(i>-1){let t=r[i];if(!e.customerId&&t.customerId){e.customerId=t.customerId;let n=X(),r=n.findIndex(t=>t.id===e.id);r>-1&&(n[r].customerId=t.customerId,B(`medirent-returns`,n))}let n=e.returnedEquipmentIds||(t.equipmentId?t.equipmentId.split(`,`).map(e=>e.trim()).filter(Boolean):[]);if(t.equipmentItems&&t.equipmentItems.length>0){let i=H(),o=t.equipmentItems.filter(e=>n.includes(e.equipmentId)),s=t.equipmentItems.filter(e=>!n.includes(e.equipmentId)&&!e.returned);if(s.length>0){a=oe();let n=t.equipmentItems.reduce((e,t)=>e+Q(t.monthlyRent||t.dailyRent||t.rentRate),0),c=s.reduce((e,t)=>e+Q(t.monthlyRent||t.dailyRent||t.rentRate),0),l=o.reduce((e,t)=>e+Q(t.monthlyRent||t.dailyRent||t.rentRate),0),u=t.equipmentItems.reduce((e,t)=>e+Q(t.deposit),0),d=s.reduce((e,t)=>e+Q(t.deposit),0),f=o.reduce((e,t)=>e+Q(t.deposit),0),p=Q(t.rentPaidAmount),m=Q(t.depositPaidAmount),h=Math.round(p*(n>0?c/n:1)),g=Math.max(0,p-h),_=Math.round(m*(u>0?d/u:1)),v=Math.max(0,m-_),y={...t,id:a,equipmentId:s.map(e=>e.equipmentId).join(`, `),serial:s.map(e=>e.serial).join(`, `),equipment:s.map(e=>i.find(t=>t.id===e.equipmentId)?.name||`Unknown`).join(`, `),monthlyRent:c,deposit:d,equipmentItems:s.map(e=>({...e,returned:!1})),rentPaidAmount:h,depositPaidAmount:_,status:t.status===`Overdue`?`Overdue`:`Active`};r.unshift(y);let b=Y(),x=!1,S=b.map(e=>{if(e.agreement!==t.id)return e;if(e.equipmentId)return s.some(t=>t.equipmentId===e.equipmentId)?(x=!0,{...e,agreement:a}):e;{x=!0;let r=Q(e.amount),i=Math.round(r*(n>0?c/n:1)),o=Math.max(0,r-i);if(i>0){let t=ue();setTimeout(()=>{let n=Y(),r={...e,id:t,agreement:a,amount:i,notes:`${e.notes||``} (Apportioned share for remaining items in agreement ${a})`};n.unshift(r),B(`medirent-payments`,n)},0)}return{...e,amount:o,notes:`${e.notes||``} (Apportioned share for returned items in agreement ${t.id})`}}});x&&localStorage.setItem(`medirent-payments`,JSON.stringify(S)),t.equipmentItems=o.map(e=>({...e,returned:!0})),t.equipmentId=o.map(e=>e.equipmentId).join(`, `),t.serial=o.map(e=>e.serial).join(`, `),t.equipment=o.map(e=>i.find(t=>t.id===e.equipmentId)?.name||`Unknown`).join(`, `),t.monthlyRent=l,t.deposit=f,t.rentPaidAmount=g,t.depositPaidAmount=v,t.status=`Completed`,t.end=e.date}else t.equipmentItems=t.equipmentItems.map(e=>n.includes(e.equipmentId)?{...e,returned:!0}:e),t.status=`Completed`,t.end=e.date,t.equipmentId=``,t.serial=``,t.equipment=``,t.monthlyRent=0,t.deposit=0}else t.status=`Completed`,t.end=e.date,t.equipmentId=``,t.equipment=``,t.serial=``,t.monthlyRent=0,t.deposit=0;t.additionalItems&&Array.isArray(t.additionalItems)&&(t.additionalItems=t.additionalItems.map(e=>e.selected&&e.status===`Not Paid`?{...e,status:`Paid`}:e)),localStorage.setItem(`medirent-rentals`,JSON.stringify(r)),n.forEach(t=>{Z(t,e.condition===`UnderMaintenance`||e.condition===`UnderMaintance`?`UnderMaintenance`:`Available`)}),Ue(t.customerId);let o=H(),s=new Set;(e.returnedEquipmentIds||[]).forEach(e=>{let t=o.find(t=>t.id===e);t?.owner&&s.add(t.owner)}),s.forEach(e=>We(e))}return q().some(t=>t.id===`doc-ret-${e.id}`)||Pe({id:`doc-ret-${e.id}`,name:`Return Receipt ${e.id}.pdf`,type:`Receipt`,size:`150 KB`,date:new Date().toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`}),rentalId:e.agreement,customerId:r.find(t=>t.id===e.agreement)?.customerId}),g()&&T(k.RETURNS,e),{list:t,newAgreementId:a}}function He(e,t){let n=X(),r=J().filter(n=>n.customerId&&n.customerId===e||n.customer&&t&&n.customer.toLowerCase()===t.toLowerCase()),i=new Set(r.map(e=>e.id)),a=n.filter(n=>n.customerId&&n.customerId===e||n.customer&&t&&n.customer.toLowerCase()===t.toLowerCase()||n.agreement&&i.has(n.agreement)).filter(e=>(e.duePendingBalance===void 0?e.refund<0?Math.abs(e.refund)-Number(e.duePaidAmount||0):0:Number(e.duePendingBalance)||0)>0||e.duePaymentStatus===`Not Paid`||e.duePaymentStatus===`Partial`),o=a.reduce((e,t)=>{let n=t.duePendingBalance===void 0?t.refund<0?Math.abs(t.refund)-Number(t.duePaidAmount||0):0:Number(t.duePendingBalance)||0;return e+Math.max(0,n)},0);return{totalDue:Math.round(o),rentalDues:0,returnDues:Math.round(o),unpaidReturns:a,unpaidRentals:[]}}function Z(e,t){let n=z(`medirent-equipment`,N),r=n.findIndex(t=>t.id===e);r>-1&&(n[r].status=t,B(`medirent-equipment`,n),g()&&T(k.EQUIPMENT,n[r]))}function Ue(e){let t=V(),n=J(),r=t.findIndex(t=>t.id===e);if(r>-1){let i=n.filter(t=>t.customerId===e&&(t.status===`Active`||t.status===`Overdue`)).length;t[r].rentals=i,t[r].status=he(t[r],n),localStorage.setItem(`medirent-customers`,JSON.stringify(t))}}function We(e){if(!e)return;let t=U(),n=t.findIndex(t=>t.name.toLowerCase()===e.toLowerCase());if(n===-1)return;let r=z(`medirent-equipment`,N).filter(t=>t.owner?.toLowerCase()===e.toLowerCase()).some(e=>e.status===`Rented`)?`Active`:`Inactive`;t[n].status!==r&&(t[n].status=r,localStorage.setItem(`medirent-owners`,JSON.stringify(t)))}function Ge(){let e=V(),t=J(),n=H(),r=Y(),i=X(),a=t.filter(e=>e.status===`Active`||e.status===`Overdue`).length,o=n.filter(e=>e.status===`Available`||e.status===`Inactive`).length,s=n.filter(e=>e.status===`Rented`||e.status===`Active`).length,c=new Date,l=c.getMonth(),u=c.getFullYear(),d=l===0?11:l-1,f=l===0?u-1:u,p=e.filter(e=>{let n=t.filter(t=>t.customerId===e.id);if(n.length===0)return!1;let r=Math.min(...n.map(e=>L(e.start).getTime())),i=new Date(r);return!isNaN(i.getTime())&&(i.getFullYear()<u||i.getFullYear()===u&&i.getMonth()<l)}).length,m=e.length-p;e.length===0||(p>0?`${(m/p*100).toFixed(1)}`:e.length*100);let h=t.filter(e=>{let t=L(e.start);return isNaN(t.getTime())?!1:(t.getFullYear()<u||t.getFullYear()===u&&t.getMonth()<l)&&e.status!==`Completed`}).length;a===0||(h>0?`${((a-h)/h*100).toFixed(1)}`:a*100);let g=i.filter(e=>{let t=L(e.date);return!isNaN(t.getTime())&&t.getMonth()===l&&t.getFullYear()===u}).length,_=i.filter(e=>{let t=L(e.date);return!isNaN(t.getTime())&&t.getMonth()===d&&t.getFullYear()===f}).length;g===0||(_>0?`${((g-_)/_*100).toFixed(1)}`:g*100),n.length>0&&`${Math.round(o/n.length*100)}`,n.length>0&&`${Math.round(s/n.length*100)}`;let v=r.filter(e=>{if(e.status!==`Paid`)return!1;let t=L(e.date);return!isNaN(t.getTime())&&t.getMonth()===l&&t.getFullYear()===u}).reduce((e,t)=>e+t.amount,0),y=r.filter(e=>{if(e.status!==`Paid`)return!1;let t=L(e.date);return!isNaN(t.getTime())&&t.getMonth()===d&&t.getFullYear()===f}).reduce((e,t)=>e+t.amount,0);v===0||y>0&&`${((v-y)/y*100).toFixed(1)}`;let b=t.filter(e=>e.status===`Overdue`).reduce((e,t)=>e+t.monthlyRent,0),x=t.filter(e=>{if(e.status!==`Overdue`)return!1;let t=L(e.start);return!isNaN(t.getTime())&&(t.getFullYear()<u||t.getFullYear()===u&&t.getMonth()<l)}).reduce((e,t)=>e+t.monthlyRent,0);b===0||x>0&&`${((b-x)/x*100).toFixed(1)}`;let S=t.filter(e=>e.status!==`Completed`).reduce((e,t)=>e+t.deposit,0),C=t.filter(e=>{let t=L(e.start);return!isNaN(t.getTime())&&(t.getFullYear()<u||t.getFullYear()===u&&t.getMonth()<l)&&e.status!==`Completed`}).reduce((e,t)=>e+t.deposit,0);S===0||C>0&&`${((S-C)/C*100).toFixed(1)}`;let w=t.filter(e=>{let t=L(e.start);return!isNaN(t.getTime())&&t.getMonth()===l&&t.getFullYear()===u}).length;return[{label:`Active Rentals`,value:a.toString(),description:`Current active rental agreements`},{label:`Agreements Made This Month`,value:w.toString(),description:`New rental agreements this month`},{label:`Agreements Closed This Month`,value:g.toString(),description:`Equipment returns this month`},{label:`Available Equipment`,value:o.toString(),description:`${o} out of ${n.length} units available`},{label:`Rented Equipment`,value:s.toString(),description:`${s} out of ${n.length} units rented`},{label:`Monthly Revenue`,value:`₹${v.toLocaleString(`en-IN`)}`,description:`Payments collected this month`},{label:`Pending Payments`,value:`₹${b.toLocaleString(`en-IN`)}`,description:`${t.filter(e=>e.status===`Overdue`).length} overdue invoices pending`},{label:`Security Deposits`,value:`₹${S.toLocaleString(`en-IN`)}`,description:`Refundable deposits in escrow`}]}function Ke(){return{Customers:V(),Equipment:H(),Rentals:J(),Payments:Y(),Returns:X(),Owners:U(),Documents:q(),Exchanges:$(),Staff:z(`medirent-staff-users`,[])}}var qe={companyName:`MediRent Healthcare Pvt Ltd`,gstin:`29ABCDE1234F1Z5`,contactEmail:`hello@medirent.in`,contactPhone:`+91 80 1234 5678`,address:`No. 21, MG Road, Bengaluru 560001`,defaultDeposit:`200`,lateFeePerDay:`50`,defaultRentalPeriod:`30`,taxRate:`18`,refundPolicy:`Full deposit refundable on undamaged equipment return within 7 days.`};function Je(){return z(`medirent-company-settings`,qe)}function Ye(e){B(`medirent-company-settings`,e),g()&&T(k.SETTINGS,{id:`company-settings`,...e})}function Xe(e,t,n=`text/plain`){if(typeof window>`u`||typeof document>`u`)return;let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,document.body.appendChild(a),a.click(),document.body.removeChild(a),setTimeout(()=>{URL.revokeObjectURL(i)},100)}function Ze(e,t,n,r){if(typeof window>`u`||typeof document>`u`)return;let i=e.endsWith(`.csv`)?e.replace(`.csv`,`.xls`):e.endsWith(`.xls`)?e:e+`.xls`,a=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<meta charset="UTF-8">
<style>
  th { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: bold; background-color: #1e3a8a; color: #ffffff; border: 0.5pt solid #cbd5e1; text-align: left; padding: 6px; font-size: 10pt; }
  td { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border: 0.5pt solid #cbd5e1; padding: 6px; font-size: 9.5pt; color: #334155; }
</style>
</head>
<body>
  <table>
    <thead>
      <tr>`;t.forEach((e,t)=>{let n=r&&r[t]?` style="width: ${r[t]}px;"`:``;a+=`\n        <th${n}>${e}</th>`}),a+=`
      </tr>
    </thead>
    <tbody>`,n.forEach(e=>{a+=`
      <tr>`,e.forEach(e=>{let t=String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`);a+=`\n        <td>${t}</td>`}),a+=`
      </tr>`}),a+=`
    </tbody>
  </table>
</body>
</html>`;let o=new Blob([a],{type:`application/vnd.ms-excel;charset=utf-8;`}),s=URL.createObjectURL(o),c=document.createElement(`a`);c.href=s,c.download=i,document.body.appendChild(c),c.click(),document.body.removeChild(c),setTimeout(()=>{URL.revokeObjectURL(s)},100)}function Qe(e){et(e)}function $e(e,t=!1,n=!1){let r=typeof window<`u`?window.location.origin:``;if(!e)return``;let i=e=>{if(e<=0||isNaN(e))return`N/A`;let t=[``,`One`,`Two`,`Three`,`Four`,`Five`,`Six`,`Seven`,`Eight`,`Nine`,`Ten`,`Eleven`,`Twelve`,`Thirteen`,`Fourteen`,`Fifteen`,`Sixteen`,`Seventeen`,`Eighteen`,`Nineteen`],n=[``,``,`Twenty`,`Thirty`,`Forty`,`Fifty`,`Sixty`,`Seventy`,`Eighty`,`Ninety`];function r(e){return e<20?t[e]:e<100?n[Math.floor(e/10)]+(e%10==0?``:` `+t[e%10]):e<1e3?t[Math.floor(e/100)]+` Hundred`+(e%100==0?``:` and `+r(e%100)):e<1e5?r(Math.floor(e/1e3))+` Thousand`+(e%1e3==0?``:` `+r(e%1e3)):e<1e7?r(Math.floor(e/1e5))+` Lakh`+(e%1e5==0?``:` `+r(e%1e5)):r(Math.floor(e/1e7))+` Crore`+(e%1e7==0?``:` `+r(e%1e7))}return r(e)+` only`},a=(e,t)=>{let n=new Date(e),r=new Date(t);if(isNaN(n.getTime())||isNaN(r.getTime())||r<n)return`0 days`;let i=r.getTime()-n.getTime(),a=Math.max(1,Math.ceil(i/(1e3*60*60*24))),o=r.getFullYear()-n.getFullYear();o=o*12+(r.getMonth()-n.getMonth());let s=r.getDate()-n.getDate();if(s<0){o--;let e=new Date(r.getFullYear(),r.getMonth(),0);s+=e.getDate()}return o>0&&s>0?`${o} month${o>1?`s`:``} and ${s} day${s>1?`s`:``}`:o>0?`${o} month${o>1?`s`:``}`:`${a} day${a===1?``:`s`}`},o=(t,n,r,i)=>{let a=new Date(t),o=new Date(n);if(isNaN(a.getTime())||isNaN(o.getTime())||o<a)return 0;let s=o.getTime()-a.getTime(),c=Math.max(1,Math.ceil(s/(1e3*60*60*24)));return e.equipmentItems&&e.equipmentItems.length>0?e.equipmentItems.reduce((e,r)=>Q(r.monthlyRent)>0?e+ft(r.monthlyRent,c,t,n):e+c*Q(r.dailyRent||r.rentRate),0):r>0?ft(r,c,t,n):c*i},s=V().find(t=>t.id===e.customerId),c=e.customer||s?.name||`Valued Customer`,l=s?.address||`No address on file`,u=s?.area||``,d=s?.city||`Mysore`,f=s?.state||`Karnataka`,p=s?.pincode||``,m=s?.phone||`N/A`,h=s?.altPhone||``;s?.email;let g=e.start?ne(e.start):`N/A`,_=``;if(e.equipmentItems&&e.equipmentItems.length>0){let t=H();_=e.equipmentItems.map(e=>{let n=t.find(t=>t.id===e.equipmentId),r=n?.name||e.name||`Equipment`,i=n?.model||`Standard`,a=e.serial||n?.serial||`XXXX`;return`
         <tr>
          <td style="padding: 6px 10px; font-weight: bold;">${r}</td>
          <td style="padding: 6px 10px; text-align: center; font-weight: bold; color: ${e.returned?`#dc2626`:`#059669`};">${e.returned?`NO (Returned)`:`YES`}</td>
          <td style="padding: 6px 10px;">${i}</td>
          <td style="padding: 6px 10px; font-family: monospace;">${a}</td>
          <td style="padding: 6px 10px;"></td>
          <td style="padding: 6px 10px;"></td>
        </tr>
      `}).join(``)}else{let t=[{name:`Oxygen Concentrator`,key:`oxygen`},{name:`Bipap`,key:`bipap`},{name:`Auto Cpap`,key:`cpap`},{name:`Patient Monitor`,key:`monitor`},{name:`Surgical Cot`,key:`cot`},{name:`Wheel Chair`,key:`chair`}].filter(t=>e.equipment.toLowerCase().includes(t.key));_=t.length>0?t.map(t=>`
        <tr>
          <td style="padding: 6px 10px;">${t.name}</td>
          <td style="padding: 6px 10px; text-align: center; font-weight: bold; color: #059669;">YES</td>
          <td style="padding: 6px 10px;">${e.model||`BMC-D`}</td>
          <td style="padding: 6px 10px; font-family: monospace;">${e.serial||`XXXX`}</td>
          <td style="padding: 6px 10px;"></td>
          <td style="padding: 6px 10px;"></td>
        </tr>
      `).join(``):`
        <tr>
          <td style="padding: 6px 10px; font-weight: bold;">${e.equipment}</td>
          <td style="padding: 6px 10px; text-align: center; font-weight: bold; color: #059669;">YES</td>
          <td style="padding: 6px 10px;">${e.model||`Standard`}</td>
          <td style="padding: 6px 10px; font-family: monospace;">${e.serial||`XXXX`}</td>
          <td style="padding: 6px 10px;"></td>
          <td style="padding: 6px 10px;"></td>
        </tr>
      `}let v=e.monthlyRent>0,y=v?e.monthlyRent||0:e.dailyRent||0,b=v?`Monthly Rent Rate`:`Daily Rent Rate`;i(y);let x=e.deposit||0;i(x);let S=0;e.rentalPaymentStatus===`Paid`?S=y:e.rentalPaymentStatus===`Partial`&&(S=Number(e.rentPaidAmount)||0);let C=0;e.depositPaymentStatus===`Paid`?C=x:e.depositPaymentStatus===`Partial`&&(C=Number(e.depositPaidAmount)||0);let w=(e.additionalItems||[]).filter(e=>e.selected),T=x+y,E=C+S;w.forEach(e=>{e.status!==`Free of Cost`&&(T+=Number(e.amount)||0),e.status===`Paid`&&(E+=Number(e.amount)||0)});let D=T-E,O=i(T),k=i(E),A=i(D),j=`
    <tr>
      <td style="font-weight: bold;">${b}</td>
      <td style="text-align: right;">Rs. ${y.toLocaleString(`en-IN`)}</td>
      <td style="text-align: right;">Rs. ${S.toLocaleString(`en-IN`)}</td>
      <td>Status: <strong>${e.rentalPaymentStatus||`Not Paid`}</strong></td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Security Deposit</td>
      <td style="text-align: right;">Rs. ${x.toLocaleString(`en-IN`)}</td>
      <td style="text-align: right;">Rs. ${C.toLocaleString(`en-IN`)}</td>
      <td>Status: <strong>${e.depositPaymentStatus||`Not Paid`}</strong></td>
    </tr>
  `;w.forEach(e=>{let t=e.status===`Free of Cost`?0:e.amount,n=e.status===`Paid`?e.amount:0;j+=`
      <tr>
        <td style="font-weight: bold;">${e.name}</td>
        <td style="text-align: right;">Rs. ${t.toLocaleString(`en-IN`)}</td>
        <td style="text-align: right;">Rs. ${n.toLocaleString(`en-IN`)}</td>
        <td>Status: <strong>${e.status||`Not Paid`}</strong></td>
      </tr>
    `}),j+=`
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <td style="font-weight: bold;">Total Upfront Amount Due</td>
      <td style="text-align: right;">Rs. ${T.toLocaleString(`en-IN`)}</td>
      <td colspan="2" style="font-weight: normal; font-size: 11px; color: #475569;">Rs. ${O}</td>
    </tr>
    <tr style="background-color: #f0fdf4; font-weight: bold; color: #15803d;">
      <td style="font-weight: bold;">Total Amount Paid</td>
      <td colspan="2" style="text-align: right; padding-right: 35px;">Rs. ${E.toLocaleString(`en-IN`)}</td>
      <td style="font-weight: normal; font-size: 11px;">Rs. ${k}</td>
    </tr>
    <tr style="font-weight: bold; ${D>0?`background-color: #fef2f2; color: #b91c1c;`:`background-color: #f0fdf4; color: #15803d;`}">
      <td style="font-weight: bold;">Remaining Balance Due</td>
      <td colspan="2" style="text-align: right; padding-right: 35px;">Rs. ${D.toLocaleString(`en-IN`)}</td>
      <td style="font-weight: normal; font-size: 11px;">${D>0?`Rs. `+A:`Fully Paid`}</td>
    </tr>
  `;let M=Y().filter(t=>t.agreement===e.id&&t.status===`Paid`),N=M.filter(e=>e.type===`Rent`||e.type===`Rent Payment`).reduce((e,t)=>e+t.amount,0);N===0&&(e.rentalPaymentStatus===`Paid`||e.rentalPaymentStatus===`Partial`)&&(N=e.rentPaidAmount||e.totalRent||e.monthlyRent||0);let P=M.filter(e=>e.type===`Deposit`||e.type===`Security Deposit`).reduce((e,t)=>e+t.amount,0);P===0&&(e.depositPaymentStatus===`Paid`||e.depositPaymentStatus===`Partial`)&&(P=e.depositPaidAmount||e.deposit||0);let F=N+P,ee=re(),te=e.status===`Completed`&&e.end||ee;a(e.start,te);let I=o(e.start,te,e.monthlyRent||0,e.dailyRent||0);F>I?F-I:I-F;let L=[],ie=[];for(let e=0;e<=36;e++){let t=M[e],n=M[e+37];L.push(`
      <tr>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: center; font-size: 11px;">${e+1}</td>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: right; font-size: 11px;">${t?`₹`+t.amount.toLocaleString(`en-IN`):``}</td>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: center; font-size: 11px;">${t?new Date(t.date).toLocaleDateString(`en-IN`):``}</td>
      </tr>
    `),ie.push(`
      <tr>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: center; font-size: 11px;">${e+38}</td>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: right; font-size: 11px;">${n?`₹`+n.amount.toLocaleString(`en-IN`):``}</td>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: center; font-size: 11px;">${n?new Date(n.date).toLocaleDateString(`en-IN`):``}</td>
      </tr>
    `)}return`
<!DOCTYPE html>
<html>
<head>
  <title>Agreement ${e.id}</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 15mm;
    }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      line-height: 1.4;
      font-size: 12.5px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      ${n?`zoom: 0.65; max-width: 794px; margin: 20px auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; padding: 40px !important;`:``}
    }
    .page {
      width: 100%;
      box-sizing: border-box;
      position: relative;
    }
    .page-break {
      page-break-after: always;
      break-after: page;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
      margin-bottom: 12px;
    }
    .header-logo {
      width: 130px;
      vertical-align: middle;
    }
    .header-text {
      text-align: right;
      vertical-align: middle;
    }
    .company-title {
      font-size: 28px;
      font-weight: 800;
      color: #ef4444;
      margin: 0;
      line-height: 1.1;
    }
    .company-subtitle {
      font-size: 11px;
      color: #2563eb;
      font-weight: 600;
      margin: 4px 0 0 0;
      line-height: 1.3;
    }
    .company-contact {
      font-size: 10.5px;
      color: #475569;
      margin: 3px 0 0 0;
      line-height: 1.3;
    }
    .blue-divider {
      border-bottom: 2.5px solid #2563eb;
      margin-bottom: 15px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
      margin-bottom: 15px;
    }
    .doc-title {
      text-align: center;
      font-size: 15px;
      font-weight: 800;
      color: #ef4444;
      text-decoration: underline;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #ef4444;
      text-decoration: underline;
      margin-top: 18px;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .details-list {
      margin-bottom: 15px;
    }
    .details-row {
      margin-bottom: 4px;
    }
    .details-label {
      font-weight: 700;
      width: 150px;
      display: inline-block;
    }
    .details-value {
      display: inline-block;
    }
    .p-body {
      text-align: justify;
      text-justify: inter-word;
      margin-bottom: 12px;
      font-size: 12.5px;
      line-height: 1.45;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #1e293b;
      padding: 7px 10px;
      font-size: 12px;
      text-align: left;
    }
    table.data-table th {
      background-color: #f1f5f9;
      font-weight: 800;
    }
    .signature-container {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 15px;
    }
    .sig-column {
      width: 45%;
      text-align: left;
    }
    .sig-column-right {
      width: 45%;
      text-align: right;
    }
    .sig-box {
      height: 60px;
      display: flex;
      align-items: flex-end;
      margin-bottom: 8px;
    }
    ol.terms-list {
      margin-left: 0;
      padding-left: 18px;
      font-size: 12px;
    }
    ol.terms-list li {
      margin-bottom: 6px;
      text-align: justify;
    }
  </style>
</head>
<body>
  <!-- ════════════════ PAGE 1 ════════════════ -->
  <div class="page">
    <table class="header-table">
      <tr>
        <td class="header-logo">
          <img src="${r}/images/logo.png" alt="Relife Logo" style="height: 65px; width: auto; object-fit: contain;" />
        </td>
        <td class="header-text">
          <h1 class="company-title">Relife Medical Technologies</h1>
          <p class="company-subtitle">Behind House No.MIG-15, Left to Prasanna Lingeshwara Temple,<br>Near Vijaya Bank Circle, Kuvempunagar, Mysore-570023.</p>
          <p class="company-contact">Mob No - 8660095261, 8951585261, 8123828442<br>GSTIN-29DCVPS6218E1ZX, Drug Licence No-KA-MY1-233278/79</p>
        </td>
      </tr>
    </table>
    
    <div class="blue-divider"></div>
    
    <table class="meta-table">
      <tr>
        <td style="font-weight: bold; font-size: 13px; color: #ef4444;">Agreement No: ${e.id}</td>
        <td style="text-align: right; font-weight: bold; font-size: 13px; color: #ef4444;">Date: ${g}</td>
      </tr>
    </table>
    
    <div class="doc-title">EQUIPMENT RENTAL AGREEMENT</div>
    
    <p class="p-body">
      This Equipment Rental Agreement dated <strong>${g}</strong> between the Lessor of the first party <strong>"M/s Relife Medical Technologies, Mysore"</strong> and the Lessee of the second party
    </p>
    
    <div class="details-list">
      <div class="details-row"><span class="details-label">Customer Name:</span><span class="details-value">${c}</span></div>
      <div class="details-row"><span class="details-label">Customer Address:</span><span class="details-value">${l}, ${u?u+`, `:``}${d}, ${f} - ${p}</span></div>
      <div class="details-row"><span class="details-label">Mobile Numbers:</span><span class="details-value">${m}${h?`, `+h:``}</span></div>
    </div>
    
    <p class="p-body">
      The lessor and the Lessee are collectively the parties in consideration of the mutual convenient are promises in this agreement the sufficiency of which the parties acknowledge the Lessor has rented the below equipment to Lessee. The Lessee has hired the equipment from the Lessor on the following terms and conditions.
    </p>
    
    <div class="section-title">EQUIPMENT DETAILS ARE AS FOLLOWS: -</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Equipment Name</th>
          <th style="text-align: center;">Hired</th>
          <th>Model</th>
          <th>M/C Sr.No</th>
          <th>Ref.No</th>
          <th>Ref.Date</th>
        </tr>
      </thead>
      <tbody>
        ${_}
      </tbody>
    </table>
    
    <div class="section-title">RENT AND DEPOSIT DETAILS: -</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 220px;">Upfront Charge Details</th>
          <th style="width: 120px; text-align: right;">Amount Due</th>
          <th style="width: 120px; text-align: right;">Amount Paid</th>
          <th>Payment Status</th>
        </tr>
      </thead>
      <tbody>
        ${j}
        <tr>
          <td style="font-weight: bold;">Payment Mode</td>
          <td colspan="3">
            ${E>0?`
              ${e.paymentMode||`Cash`}
              ${e.paymentMode===`Cash+Bank`?` <strong>(Cash: Rs. ${(e.cashPaidAmount||0).toLocaleString(`en-IN`)}, Bank/UPI: Rs. ${(e.bankUpiPaidAmount||0).toLocaleString(`en-IN`)})</strong>`:``}
              ${e.paymentCollectedBy?` (Collected By: `+e.paymentCollectedBy+`)`:``}
            `:`N/A`}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; vertical-align: top;">Note:-</td>
          <td colspan="3">Extra payment is for one-time accessory or personal purchases, non-returnable and non-refundable.</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Remarks</td>
          <td colspan="3">${e.remarks||`N/A`}</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <div class="page-break"></div>
  
  <!-- ════════════════ PAGE 2 ════════════════ -->
  <div class="page">
    <div class="section-title" style="margin-top: 0;">HIRING TERMS & CONDITIONS: -</div>
    <ol class="terms-list" type="a">
      <li>The Lessor agrees to rent the above equipment to the Lessee, and the Lessee agrees to hire the above equipment from the Lessor in accordance with the terms set out in this agreement.</li>
      <li>This rental term commences from the date of rental agreement and will continue on a month-to-month or day-to-day basis until Lessor or the Lessee terminates this agreement.</li>
      <li>Lessee will have to carry out the machine from the Lessor office at the time of hiring and then Lessee must have to return the equipment to Lessor office on Lessee's own expense after completion of the term.</li>
      <li>Minimum one month rent will be applicable even if machine has returned early in between the rental term.</li>
      <li>Monthly rent should be paid from the Lessee on the term date for each month in advance based.</li>
      <li>First month rent will be taken in advance with the deposit amount.</li>
      <li>The Lessor will refund the deposit amount to Lessee at the end of the rental term.</li>
      <li>If the equipment is not returned or rent not paid from the Lessee, the Lessor has the fully authority to take legal action on Lessee.</li>
      <li>The equipment should be used under the supervision of a licensed physician.</li>
      <li>The Lessor shall not be responsible for any consequential loss directly or indirectly due to sudden cause of device fault / due to faulty operation.</li>
    </ol>
    
    <div class="section-title">REPAIR OF THE EQUIPMENT: -</div>
    <ol class="terms-list" type="a">
      <li>The Lessee must have to carry out the monthly preventive maintenance to keep the equipment in good working condition from the Lessee's own expense.</li>
      <li>The Lessee must have to bear their own expense if any fault/damage occurred due to mishandling of the equipment / due to power fluctuation in the house.</li>
      <li>The Lessor will not carry out any kind of service at Lessee's location / at patient location. The Lessee must have to bring the equipment for service/replacement purpose during the office hours only from 10am to 6pm except Sunday and holidays.</li>
      <li>The Lessee must have to keep one backup Oxygen cylinder / Ups for uninterrupted usage of the equipment on their own expense.</li>
      <li>Lessor shall not be able to provide service 24/7.</li>
    </ol>
    
    <div class="signature-container">
      <div class="sig-column">
        <span style="font-weight: bold; color: #ef4444; font-size: 13px;">For Relife Medical Technologies</span>
        <div class="sig-box">
          <img src="${r}/images/logo.png" alt="Relife Logo" style="height: 38px; width: auto; object-fit: contain; transform: rotate(-5deg); opacity: 0.85;" />
        </div>
        <span style="font-weight: bold; color: #ef4444; font-size: 12px;">(Authorized Signatory)</span>
      </div>
      <div class="sig-column-right">
        <span style="font-weight: bold; font-size: 13px;">I agree to the above terms & conditions.</span>
        <div class="sig-box" style="justify-content: flex-end; align-items: flex-end; padding-bottom: 10px;">
          ${e.signatureUrl?`<img src="${e.signatureUrl}" alt="Customer Signature" style="max-height: 50px; max-width: 150px; object-fit: contain;" />`:`<span style="border-bottom: 1px dotted #64748b; width: 150px; display: inline-block;"></span>`}
        </div>
        <span style="font-weight: bold; font-size: 12.5px;">Customer Name: ${c}</span><br>
        <span style="font-weight: bold; font-size: 11px; color: #64748b;">Customer Signature</span>
      </div>
    </div>
  </div>

  ${t?`
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  <\/script>
  `:``}
</body>
</html>
  `}function et(e){if(!e||typeof window>`u`)return;let t=window.open(``,`_blank`);if(!t){alert(`Please allow popups to print/download the agreement.`);return}let n=$e(e,!0);t.document.write(n),t.document.close()}function tt(e,t){let n=typeof window<`u`?window.location.origin:``;if(!e||typeof window>`u`)return;let r=window.open(``,`_blank`);if(!r){alert(`Please allow popups to print/download the receipt.`);return}let i=`
<!DOCTYPE html>
<html>
<head>
  <title>Receipt ${e.id}</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
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
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
      position: relative;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #10b981;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo-area h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: #065f46;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .logo-area p {
      font-size: 11px;
      color: #64748b;
      margin: 4px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .doc-type {
      text-align: right;
    }
    .doc-type h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .doc-type p {
      font-size: 12px;
      font-family: monospace;
      color: #10b981;
      margin: 4px 0 0 0;
      font-weight: bold;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
      font-size: 13.5px;
    }
    .info-label {
      color: #64748b;
    }
    .info-value {
      font-weight: 600;
      color: #0f172a;
      text-align: right;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .receipt-row:last-child {
      border-bottom: none;
    }
    .total-box {
      background-color: #ecfdf5;
      border: 1px solid #d1fae5;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
      margin-bottom: 30px;
    }
    .total-label {
      font-weight: 700;
      color: #065f46;
      font-size: 14px;
      text-transform: uppercase;
    }
    .total-amount {
      font-family: 'Outfit', sans-serif;
      font-size: 24px;
      font-weight: 800;
      color: #047857;
    }
    .status-badge {
      display: inline-block;
      background-color: #d1fae5;
      color: #065f46;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 9999px;
      letter-spacing: 0.05em;
    }
    .footer-note {
      text-align: center;
      font-size: 12px;
      color: #64748b;
      margin-top: 40px;
      border-top: 1px dashed #e2e8f0;
      padding-top: 20px;
    }
    .no-print-btn {
      display: block;
      width: max-content;
      margin: 20px auto 0 auto;
      padding: 10px 20px;
      background-color: #10b981;
      color: white;
      border: none;
      border-radius: 8px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgb(16 185 129 / 0.2);
      transition: background-color 0.2s;
    }
    .no-print-btn:hover {
      background-color: #059669;
    }
    @media print {
      body {
        padding: 0;
        background-color: transparent;
      }
      .container {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .no-print-btn {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-area" style="display: flex; flex-direction: column; align-items: flex-start;">
        <img src="${n}/images/logo.png" alt="Relife Medical Technologies" style="height: 48px; width: auto; object-fit: contain;" />
      </div>
      <div class="doc-type">
        <h2>PAYMENT RECEIPT</h2>
        <p class="font-mono">${e.id}</p>
      </div>
    </div>

    <div class="info-grid">
      <div style="grid-column: span 2; background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase;">Billed To</span>
          <span style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase;">Transaction Info</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <div>
            <p style="margin: 0; font-weight: 700; font-size: 15px;">${t||e.customer||`Valued Customer`}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; font-family: monospace;">ID: ${e.customerId||`N/A`}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 13px;"><strong>Date:</strong> ${e.date}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px;"><strong>Agreement:</strong> <span style="font-family: monospace; color: #0284c7; font-weight: bold;">${e.agreement||`N/A`}</span></p>
          </div>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <div class="receipt-row">
        <span class="info-label">Payment Category / Type</span>
        <span class="info-value">${e.type}</span>
      </div>
      <div class="receipt-row">
        <span class="info-label">Payment Mode</span>
        <span class="info-value">${e.mode}</span>
      </div>
      <div class="receipt-row">
        <span class="info-label">Reference Number (Tx Ref)</span>
        <span class="info-value font-mono">${e.txRef||`N/A`}</span>
      </div>
      <div class="receipt-row">
        <span class="info-label">Transaction Status</span>
        <span class="info-value"><span class="status-badge">SUCCESSFUL</span></span>
      </div>
    </div>

    <div class="total-box">
      <span class="total-label">Total Amount Paid</span>
      <span class="total-amount">₹${e.amount?.toLocaleString(`en-IN`)||`0`}</span>
    </div>

    <div class="footer-note">
      <p style="margin: 0; font-weight: 600; color: #475569;">Thank you for your business!</p>
      <p style="margin: 4px 0 0 0; font-size: 11px;">This is a digitally generated e-receipt. No physical signature is required.</p>
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
  `;r.document.write(i),r.document.close()}function nt(e,t=!1,n=!1){return typeof window<`u`&&window.location.origin,e?`
<!DOCTYPE html>
<html>
<head>
  <title>Return Agreement ${e.id}</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 15mm;
    }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      line-height: 1.45;
      font-size: 12.5px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      ${n?`zoom: 0.65; max-width: 794px; margin: 20px auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; padding: 40px !important;`:``}
    }
    .page {
      width: 100%;
      box-sizing: border-box;
      position: relative;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
      margin-bottom: 12px;
    }
    .header-logo {
      width: 130px;
      vertical-align: middle;
    }
    .header-text {
      text-align: right;
      vertical-align: middle;
    }
    .company-title {
      font-size: 28px;
      font-weight: 800;
      color: #ef4444;
      margin: 0;
      line-height: 1.1;
    }
    .company-subtitle {
      font-size: 11px;
      color: #2563eb;
      font-weight: 600;
      margin: 4px 0 0 0;
      line-height: 1.3;
    }
    .company-contact {
      font-size: 10.5px;
      color: #475569;
      margin: 3px 0 0 0;
      line-height: 1.3;
    }
    .blue-divider {
      border-bottom: 2.5px solid #2563eb;
      margin-bottom: 15px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
      margin-bottom: 15px;
    }
    .doc-title {
      text-align: center;
      font-size: 15px;
      font-weight: 800;
      color: #ef4444;
      text-decoration: underline;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #ef4444;
      text-decoration: underline;
      margin-top: 18px;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .details-list {
      margin-bottom: 15px;
    }
    .details-row {
      margin-bottom: 4px;
    }
    .details-label {
      font-weight: 700;
      width: 150px;
      display: inline-block;
    }
    .details-value {
      display: inline-block;
    }
    .p-body {
      text-align: justify;
      text-justify: inter-word;
      margin-bottom: 12px;
      font-size: 12.5px;
      line-height: 1.45;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #1e293b;
      padding: 7px 10px;
      font-size: 12px;
      text-align: left;
    }
    table.data-table th {
      background-color: #f1f5f9;
      font-weight: 800;
    }
    .signature-container {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 15px;
    }
    .sig-column {
      width: 45%;
      text-align: left;
    }
    .sig-column-right {
      width: 45%;
      text-align: right;
    }
    .sig-box {
      height: 60px;
      display: flex;
      align-items: flex-end;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="page">
    <table class="header-table">
      <tr>
        <td class="header-logo">
          <img src="/images/logo.png" alt="Relife Logo" style="height: 65px; width: auto; object-fit: contain;" />
        </td>
        <td class="header-text">
          <h1 class="company-title">Relife Medical Technologies</h1>
          <p class="company-subtitle">Behind House No.MIG-15, Left to Prasanna Lingeshwara Temple,<br>Near Vijaya Bank Circle, Kuvempunagar, Mysore-570023.</p>
          <p class="company-contact">Mob No - 8660095261, 8951585261, 8123828442<br>GSTIN-29DCVPS6218E1ZX, Drug Licence No-KA-MY1-233278/79</p>
        </td>
      </tr>
    </table>
    
    <div class="blue-divider"></div>
    
    <table class="meta-table">
      <tr>
        <td style="font-weight: bold; font-size: 13px; color: #ef4444;">Return ID: ${e.id}</td>
        <td style="text-align: right; font-weight: bold; font-size: 13px; color: #ef4444;">Date: ${e.date}</td>
      </tr>
    </table>
    
    <div class="doc-title">EQUIPMENT RETURN & SETTLEMENT AGREEMENT</div>
    
    <p class="p-body">
      This Return Settlement Agreement confirms that the equipment detailed below has been returned by the Lessee to the Lessor <strong>"M/s Relife Medical Technologies, Mysore"</strong>, in the condition stated, and the financial reconciliation has been completed as follows:
    </p>
    
    <div class="details-list">
      <div class="details-row"><span class="details-label">Customer Name:</span><span class="details-value">${e.customer}</span></div>
      <div class="details-row"><span class="details-label">Agreement ID:</span><span class="details-value">${e.agreement}</span></div>
      ${e.collectedBy?`<div class="details-row"><span class="details-label">Return Collected By:</span><span class="details-value">${e.collectedBy}</span></div>`:``}
    </div>
    
    <div class="section-title">RETURNED EQUIPMENT DETAILS: -</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Equipment Name</th>
          <th style="width: 150px; text-align: center;">Returned Condition</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight: bold;">${e.equipment}</td>
          <td style="text-align: center; font-weight: bold; color: ${e.condition?.toLowerCase()?.includes(`maint`)?`#d97706`:`#16a34a`};">${e.condition||`Good`}</td>
        </tr>
      </tbody>
    </table>
    
    <div class="section-title">FINANCIAL RECONCILIATION LEDGER: -</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Ledger Item Description</th>
          <th style="width: 150px; text-align: right;">Amount Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Original Security Deposit Paid (Credit)</td>
          <td style="text-align: right; font-weight: 600; color: #16a34a;">+ Rs. ${e.deposit?.toLocaleString(`en-IN`)||`0`}</td>
        </tr>
        ${e.finalRent>0?`
        <tr>
          <td>Adjusted Pro-Rata Rent Charges (Debit)</td>
          <td style="text-align: right; color: #dc2626;">− Rs. ${e.finalRent?.toLocaleString(`en-IN`)||`0`}</td>
        </tr>
        `:``}
        ${e.unpaidAccessoryTotal>0?`
        <tr>
          <td>Deductions: Unpaid Accessories / Additional Items (Debit)</td>
          <td style="text-align: right; color: #dc2626;">− Rs. ${e.unpaidAccessoryTotal?.toLocaleString(`en-IN`)||`0`}</td>
        </tr>
        `:``}
        ${e.damageCharges>0?`
        <tr>
          <td>Deductions: Damage Assessment Charges (Debit)</td>
          <td style="text-align: right; color: #dc2626;">− Rs. ${e.damageCharges?.toLocaleString(`en-IN`)||`0`}</td>
        </tr>
        `:``}
        ${e.pendingBalance>0?`
        <tr>
          <td>Deductions: Overdue / Outstanding Balance (Debit)</td>
          <td style="text-align: right; color: #dc2626;">− Rs. ${e.pendingBalance?.toLocaleString(`en-IN`)||`0`}</td>
        </tr>
        `:``}
        ${e.discount>0?`
        <tr>
          <td>Reconciliation Discount Offset (Credit)</td>
          <td style="text-align: right; font-weight: 600; color: #16a34a;">+ Rs. ${e.discount?.toLocaleString(`en-IN`)||`0`}</td>
        </tr>
        `:``}
        
        <tr style="font-weight: bold; ${e.refund>=0?`background-color: #f0fdf4; color: #15803d;`:`background-color: #fef2f2; color: #b91c1c;`}">
          <td style="font-weight: bold;">
            ${e.refund>=0?`NET REFUND PAYABLE TO LESSEE`:`NET OUTSTANDING DUES PAYABLE TO LESSOR`}
          </td>
          <td style="text-align: right; font-weight: 800; font-size: 13.5px;">
            Rs. ${Math.abs(e.refund||0).toLocaleString(`en-IN`)}
          </td>
        </tr>
        <tr style="font-weight: bold; ${e.refund>=0?`background-color: #f0fdf4; color: #15803d;`:e.duePaymentStatus===`Not Paid`?`background-color: #fef2f2; color: #b91c1c;`:`background-color: #f0fdf4; color: #15803d;`}">
          <td colspan="2" style="text-align: center; padding: 10px; border: 1.5px solid ${e.refund>=0?`#16a34a`:e.duePaymentStatus===`Not Paid`?`#dc2626`:`#16a34a`}; font-size: 13px;">
            ${e.refund>=0?`✓ STATUS: RETURNED SUCCESSFULLY & REFUNDED TOTAL AMOUNT OF Rs. ${Math.abs(e.refund||0).toLocaleString(`en-IN`)}`:e.duePaymentStatus===`Not Paid`?`⚠️ STATUS: RETURNED — UNPAID PENDING DUE OF Rs. ${Math.abs(e.refund||0).toLocaleString(`en-IN`)}`:`✓ STATUS: RETURNED SUCCESSFULLY & PAID TOTAL AMOUNT OF Rs. ${Math.abs(e.refund||0).toLocaleString(`en-IN`)}${e.duePaymentMode?` (${e.duePaymentMode.toUpperCase()})`:``}`}
          </td>
        </tr>
      </tbody>
    </table>

    <p class="p-body" style="font-size: 11px; color: #64748b; margin-top: 15px;">
      *Note: By signing below, both parties acknowledge and agree that the equipment has been returned and received in the stated condition, and that all financial claims and balances under this agreement are fully reconciled and settled.
    </p>
    
    <div class="signature-container">
      <div class="sig-column">
        <div class="sig-box">
          <span style="border-bottom: 1.5px solid #1e293b; width: 180px; display: inline-block;"></span>
        </div>
        <span style="font-weight: bold; font-size: 12px; color: #0f172a;">Signature of the Lessee (Customer)</span>
      </div>
      <div class="sig-column-right">
        <div class="sig-box" style="justify-content: flex-end;">
          <span style="border-bottom: 1.5px solid #1e293b; width: 180px; display: inline-block;"></span>
        </div>
        <span style="font-weight: bold; font-size: 12px; color: #0f172a;">For M/s Relife Medical Technologies</span>
      </div>
    </div>
  </div>

  ${t?`
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  <\/script>
  `:``}
</body>
</html>
  `:``}function rt(e){if(!e||typeof window>`u`)return;let t=window.open(``,`_blank`);if(!t){alert(`Please allow popups to print/download the receipt.`);return}let n=nt(e,!0);t.document.write(n),t.document.close()}function it(e){if(e.fileData&&e.fileData!==`PDF`&&e.fileData.startsWith(`data:`))return e.fileData;let t=e.type===`Agreement`||e.name.toLowerCase().includes(`agreement`)&&!e.name.toLowerCase().includes(`return`),n=e.type===`Return`||e.name.toLowerCase().includes(`return`);if(t){let t=e.rentalId;if(!t){let n=e.name.match(/AGR-\d{4}-\d{4}/i);n&&(t=n[0].toUpperCase())}let n=J().find(e=>e.id===t);if(n){let e=$e(n,!1,!0);return`data:text/html;charset=utf-8,`+encodeURIComponent(e)}}else if(n){let t=X(),n=``;if(e.id.startsWith(`doc-ret-`)&&(n=e.id.replace(`doc-ret-`,``).toUpperCase()),!n){let t=e.name.match(/RET-\d{4}-\d{4}/i);t&&(n=t[0].toUpperCase())}n||=e.id;let r=t.find(t=>t.id===n||t.id===e.id||t.id.toUpperCase()===n.toUpperCase());if(r){let e=nt(r,!1,!0);return`data:text/html;charset=utf-8,`+encodeURIComponent(e)}}let r=e.type||`Document`,i=`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${e.name} - Verification Sheet</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 30px;
      background-color: #f8fafc;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      width: 100%;
      max-width: 450px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
      text-align: center;
    }
    .logo {
      font-size: 28px;
      margin-bottom: 10px;
    }
    h2 {
      margin: 0;
      font-size: 20px;
      color: #0f172a;
    }
    .doc-name {
      font-family: monospace;
      font-size: 13px;
      color: #64748b;
      margin: 4px 0 20px 0;
      word-break: break-all;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: #d1fae5;
      color: #065f46;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      border-radius: 9999px;
      margin-bottom: 24px;
    }
    .details {
      text-align: left;
      border-top: 1px solid #f1f5f9;
      padding-top: 20px;
      margin-bottom: 24px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 13px;
    }
    .label {
      color: #64748b;
    }
    .value {
      font-weight: 600;
      color: #334155;
    }
    .footer {
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🔒</div>
    <h2>Document Archive</h2>
    <div class="doc-name">${e.name}</div>
    <span class="badge">SECURELY ARCHIVED</span>
    
    <div class="details">
      <div class="row">
        <span class="label">Document ID</span>
        <span class="value" style="font-family: monospace;">${e.id}</span>
      </div>
      <div class="row">
        <span class="label">Category</span>
        <span class="value">${r}</span>
      </div>
      <div class="row">
        <span class="label">Uploaded On</span>
        <span class="value">${e.date}</span>
      </div>
      <div class="row">
        <span class="label">File Size</span>
        <span class="value">${e.size||`150 KB`}</span>
      </div>
    </div>
    
    <div class="footer">
      MediRent Secure Document Vault
    </div>
  </div>
</body>
</html>
  `;return`data:text/html;charset=utf-8,`+encodeURIComponent(i)}function at(e){let t=e.split(`,`),n=t[0].match(/:(.*?);/),r=n?n[1]:``,i=atob(t[1]),a=i.length,o=new Uint8Array(a);for(;a--;)o[a]=i.charCodeAt(a);return new Blob([o],{type:r})}function ot(e,t){if(!(typeof window>`u`||!e))try{let n=at(e),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=t,document.body.appendChild(i),i.click(),document.body.removeChild(i),setTimeout(()=>{URL.revokeObjectURL(r)},100)}catch(e){console.error(`Failed to download base64 file`,e)}}async function st(e){let t=e.fileData,n=e.type!==`Agreement`&&!e.id.startsWith(`doc-ret-`)&&!e.id.startsWith(`doc-pay-`);if((!t||t===`NOT_FOUND`)&&n&&(t=await K(e.id),!t&&g())){let n=await je(e.id);n&&(t=n,G(e.id,n))}if(t&&t!==`PDF`&&t.startsWith(`data:`))return ot(t,e.name),!0;if(e.type===`Agreement`){let t=J().find(t=>t.id===e.rentalId||e.id.endsWith(t.id)||e.id.includes(t.id));if(t)return et(t),!0}else if(e.type===`Invoice`||e.type===`Receipt`){if(e.id.startsWith(`doc-ret-`)){let t=X(),n=e.id.replace(`doc-ret-`,``),r=t.find(t=>t.id===n||e.id.includes(t.id));if(r)return rt(r),!0}let t=Y(),n=e.id.replace(`doc-pay-`,``),r=t.find(t=>t.id===n||e.id.includes(t.id));if(r)return tt(r,V().find(e=>e.id===r.customerId)?.name),!0}if(n)return!1;if(typeof window<`u`){let t=it(e),n=document.createElement(`a`);n.href=t,n.download=e.name.endsWith(`.html`)?e.name:`${e.name}.html`,document.body.appendChild(n),n.click(),document.body.removeChild(n)}return!0}async function ct(e){let t={checked:0,uploaded:0,alreadySynced:0,failed:0};if(!g())return t;let n=q();for(let r of n){let i=await K(r.id);if(i){if(t.checked++,e?.(t.checked,n.length),await je(r.id)){t.alreadySynced++;continue}await Ae(r.id,i)?t.uploaded++:t.failed++}}return t}async function lt(e=!1){if(!g())return;let t=Date.now();if(!e){let e=localStorage.getItem(`medirent-last-write-time`);if(e){let t=Date.now()-parseInt(e,10);if(t<3e4){console.log(`[GSheets] Auto-sync skipped to prevent race condition (last write was ${t}ms ago)`);return}}}w();let n=b(),r=[{key:`medirent-customers`,sheet:k.CUSTOMERS},{key:`medirent-equipment`,sheet:k.EQUIPMENT},{key:`medirent-rentals`,sheet:k.RENTALS},{key:`medirent-payments`,sheet:k.PAYMENTS},{key:`medirent-returns`,sheet:k.RETURNS},{key:`medirent-owners`,sheet:k.OWNERS},{key:`medirent-documents`,sheet:k.DOCUMENTS},{key:`medirent-exchanges`,sheet:k.EXCHANGES},{key:`medirent-staff-users`,sheet:k.STAFF},{key:`medirent-company-settings`,sheet:k.SETTINGS}].map(async e=>{try{return{entity:e,data:await O(e.sheet),error:null}}catch(t){return{entity:e,data:null,error:t}}}),i=await Promise.all(r),a=localStorage.getItem(`medirent-last-write-time`);if(a&&parseInt(a,10)>t){console.log(`[GSheets] Aborting sync write because a local write occurred during fetch`);return}let o=!1;for(let{entity:e,data:t,error:r}of i){if(r){console.warn(`[GSheets] Sync failed for ${e.sheet}:`,r);continue}if(e.key===`medirent-staff-users`){let e=z(`medirent-staff-users`,[]);if((!t||t.length===0)&&e.length>0){console.log(`[GSheets] Staff sheet is empty, uploading local staff accounts...`),e.forEach(e=>{T(k.STAFF,e)});continue}}if(t){let r=[...t],i=n.filter(t=>t.sheet===e.sheet),a=new Set(i.filter(e=>e.type===`delete`).map(e=>e.id));if(a.size>0&&(r=r.filter(e=>!a.has(e.id))),i.filter(e=>e.type===`upsert`).forEach(e=>{if(!e.data)return;let t=r.findIndex(t=>t.id===e.id);t>-1?r[t]=e.data:r.unshift(e.data)}),e.key===`medirent-company-settings`){let t=r.find(e=>e.id===`company-settings`);if(t){let{id:n,...r}=t,i=z(`medirent-company-settings`,{}),a=Object.keys(r).length>0?{...i,...r}:i;localStorage.setItem(e.key,JSON.stringify(a)),o=!0}continue}else if(e.key===`medirent-documents`){let t=z(`medirent-documents`,[]),n=r.map(e=>{let n=t.find(t=>t.id===e.id);return n&&n.fileData?{...e,fileData:n.fileData}:e});localStorage.setItem(e.key,JSON.stringify(n))}else localStorage.setItem(e.key,JSON.stringify(r));o=!0}}o&&typeof window<`u`&&window.dispatchEvent(new Event(`medirent-db-updated`))}var ut={1e3:[500,1e3,1e3,1e3],1500:[500,1e3,1500,1500],2e3:[1e3,1500,2e3,2e3],2500:[1e3,1500,2e3,2500],2800:[1e3,1500,2e3,2800],3e3:[1e3,1500,2e3,3e3],3500:[1e3,1500,2e3,3500],4e3:[1500,2e3,2500,4e3],4500:[1500,2e3,3e3,4500],5e3:[2e3,3e3,4e3,5e3],5500:[2e3,3e3,4e3,5500],6e3:[2e3,3e3,4e3,6e3],6500:[2e3,3e3,4e3,6500],7e3:[2500,3500,4500,7e3],7500:[2500,3500,5e3,7500],8e3:[2500,4e3,5e3,8e3],9e3:[3e3,4500,6e3,9e3],9500:[3500,5e3,7e3,9500],1e4:[3500,5e3,7e3,1e4],11e3:[3500,5500,7500,11e3],12e3:[4e3,6e3,8e3,12e3],13e3:[4500,7500,9e3,13e3],15e3:[6500,7500,10500,15e3],16e3:[5500,8500,10500,16e3]},Q=e=>{if(typeof e==`number`)return isNaN(e)?0:e;if(!e)return 0;let t=String(e).replace(/[^\d.-]/g,``),n=parseFloat(t);return isNaN(n)?0:n};function dt(e,t){let n=Q(e),r=Q(t),i=ut[n];if(!i){let e=Object.keys(ut).map(Number).sort((e,t)=>e-t),t=e[0],r=Math.abs(e[0]-n);for(let i of e){let e=Math.abs(i-n);e<r&&(r=e,t=i)}i=ut[t]}return r<=5?i[0]:r<=10?i[1]:r<=15?i[2]:i[3]}function ft(e,t,n,r){let i=Q(e),a=Q(t);if(a<=0||i<=0)return 0;let o=0,s=a,c=!1;if(n&&r){let e=L(n),t=L(r);if(!isNaN(e.getTime())&&!isNaN(t.getTime())&&e<=t){if(o=t.getFullYear()-e.getFullYear(),o=o*12+(t.getMonth()-e.getMonth()),s=t.getDate()-e.getDate(),s<0){o--;let e=new Date(t.getFullYear(),t.getMonth(),0);s+=e.getDate()}c=!0}}if(c||(o=Math.floor(a/30),s=a%30),o===0)return dt(i,s);let l=o*i;if(s<=5)return l;if(s<=20){let e=i/30;return Math.round(l+s*e)}else return l+i}function pt(e,t,n,r=!1){if(!e)return 0;let i=e.equipmentItems||[{equipmentId:e.equipmentId,serial:e.serial,monthlyRent:Q(e.monthlyRent),deposit:Q(e.deposit),returned:!1}],a=i.find(e=>e.equipmentId===t);if(!a)return 0;let o=Q(a.monthlyRent||a.dailyRent||a.rentRate),s=i.reduce((e,t)=>e+Q(t.monthlyRent||t.dailyRent||t.rentRate),0),c=s>0?o/s:1,l=n.filter(n=>n.agreement===e.id&&n.equipmentId===t&&n.status===`Paid`&&(n.type===`Rent`||n.type===`Rent Payment`)).reduce((e,t)=>e+Q(t.amount),0),u=n.filter(t=>t.agreement===e.id&&!t.equipmentId&&t.status===`Paid`&&(t.type===`Rent`||t.type===`Rent Payment`)).reduce((e,t)=>e+Q(t.amount),0)+(!r&&(e.rentalPaymentStatus===`Paid`||e.rentalPaymentStatus===`Partial`)&&(Number(e.rentPaidAmount)||Number(e.totalRent)||Number(e.monthlyRent))||0);return l+Math.round(u*c)}var mt=[];function $(){return R(z(`medirent-exchanges`,mt),`exchangeDate`)}function ht(){if(!I)return`EXC-${new Date().getFullYear()}-0001`;let e=new Date().getFullYear(),t=`medirent-exc-counter-${e}`,n=parseInt(localStorage.getItem(t)||`0`,10)+1;return localStorage.setItem(t,n.toString()),`EXC-${e}-${String(n).padStart(4,`0`)}`}function gt(){if(!I)return`EXC-${new Date().getFullYear()}-0001`;let e=new Date().getFullYear(),t=`medirent-exc-counter-${e}`,n=parseInt(localStorage.getItem(t)||`0`,10);return`EXC-${e}-${String(n+1).padStart(4,`0`)}`}function _t(e){let t=$(),n=t.findIndex(t=>t.id===e.id);if(n>-1?t[n]=e:t.unshift(e),B(`medirent-exchanges`,t),e.status===`Completed`){let t=J(),n=t.findIndex(t=>t.id===e.agreementId);if(n>-1){let r=t[n];if(r.equipmentItems&&r.equipmentItems.length>0){r.equipmentItems=r.equipmentItems.map(t=>t.equipmentId===e.currentEquipmentId?{...t,equipmentId:e.newEquipmentId,serial:e.newEquipmentSerial}:t);let t=r.equipmentItems.filter(e=>!e.returned);r.equipmentId=t.map(e=>e.equipmentId).join(`, `),r.serial=t.map(e=>e.serial).join(`, `);let n=H();r.equipment=t.map(e=>n.find(t=>t.id===e.equipmentId)?.name||`Unknown`).join(`, `)}else r.equipmentId=e.newEquipmentId,r.serial=e.newEquipmentSerial,r.equipment=e.newEquipment;B(`medirent-rentals`,t),g()&&T(k.RENTALS,r)}Z(e.currentEquipmentId,e.releaseCondition||`UnderMaintenance`),Z(e.newEquipmentId,`Rented`);let r=H(),i=new Set,a=r.find(t=>t.id===e.currentEquipmentId),o=r.find(t=>t.id===e.newEquipmentId);a?.owner&&i.add(a.owner),o?.owner&&i.add(o.owner),i.forEach(e=>We(e)),q().some(t=>t.id===`doc-exc-${e.id}`)||Ne({id:`doc-exc-${e.id}`,name:`Exchange Slip ${e.id}.pdf`,type:`Exchange Slip`,size:`180 KB`,date:new Date(e.exchangeDate).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`}),rentalId:e.agreementId,customerId:e.customerId})}return g()&&T(k.EXCHANGES,e),t}function vt(){let[e,t]=(0,f.useState)(0);return(0,f.useEffect)(()=>{if(typeof window>`u`)return;let e=()=>{t(e=>e+1)};return window.addEventListener(`medirent-db-updated`,e),()=>window.removeEventListener(`medirent-db-updated`,e)},[]),e}export{_t as $,fe as A,ft as B,q as C,re as D,$ as E,ce as F,le as G,L as H,U as I,rt as J,st as K,pt as L,ht as M,pe as N,oe as O,ue as P,ve as Q,Y as R,De as S,H as T,se as U,X as V,gt as W,ge as X,Ye as Y,Ne as Z,Ke as _,y as _t,te as a,lt as at,V as b,s as bt,ye as c,k as ct,Qe as d,m as dt,xe as et,ot as f,g as ft,ne as g,T as gt,ae as h,D as ht,Q as i,R as it,me as j,de as k,Se as l,j as lt,Xe as m,h as mt,Re as n,Ie as nt,_e as o,ct as ot,Ze as p,A as pt,tt as q,Le as r,Ve as rt,Fe as s,vt as st,ie as t,ze as tt,Be as u,E as ut,Je as v,d as vt,Ge as w,it as x,l as xt,He as y,o as yt,J as z};