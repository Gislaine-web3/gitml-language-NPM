const Module=require('module'),path=require('path'),os=require('os'),fs=require('fs');
const reg={cmds:{},comp:null,hover:null,fmt:null,changeHandlers:[],opened:[]};
class Pos{constructor(l,c){this.line=l;this.character=c}translate(a,b){return new Pos(this.line+(a||0),this.character+(b||0))}}
class Range{constructor(a,b,c,d){if(a instanceof Pos){this.start=a;this.end=b}else{this.start=new Pos(a,b);this.end=new Pos(c,d)}}}
class CI{constructor(l,k){this.label=l;this.kind=k}} class SS{constructor(v){this.value=v}} class MS{constructor(){this.v=''}appendMarkdown(t){this.v+=t}}
const diagSets=[];
const vscode={Position:Pos,Range,CompletionItem:CI,SnippetString:SS,MarkdownString:MS,Hover:class{constructor(m,r){this.m=m;this.r=r}},TextEdit:{replace:(r,t)=>({r,t})},
 Diagnostic:class{constructor(r,m,s){this.range=r;this.message=m;this.severity=s}},DiagnosticSeverity:{Error:0,Warning:1},CompletionItemKind:{},QuickPickItemKind:{Separator:-1},ViewColumn:{Beside:2},StatusBarAlignment:{Left:1},Uri:{file:p=>({fsPath:p,scheme:'file'}),parse:u=>({url:u})},
 workspace:{workspaceFolders:[{uri:{fsPath:os.tmpdir()}}],textDocuments:[],isTrusted:true,getWorkspaceFolder:()=>null,getConfiguration:()=>({get:(k,d)=>d}),onDidOpenTextDocument:()=>({}),onDidChangeTextDocument:h=>{reg.changeHandlers.push(h);return {}},onDidCloseTextDocument:()=>({}),onDidChangeConfiguration:()=>({})},
 languages:{createDiagnosticCollection:()=>({set(u,i){diagSets.push(i)},delete(){}}),registerCompletionItemProvider:(l,p)=>{reg.comp=p;reg.compLangs=l},registerHoverProvider:(l,p)=>{reg.hover=p},registerDocumentFormattingEditProvider:(l,p)=>{reg.fmt=p}},
 commands:{registerCommand:(n,f)=>{reg.cmds[n]=f;return {}}},
 window:{createTerminal:o=>{reg.term={opts:o,sent:[],show(){},sendText(t){this.sent.push(t)}};return reg.term},createOutputChannel:()=>({appendLine(){},dispose(){}}),createStatusBarItem:()=>({show(){},hide(){},dispose(){}}),showWarningMessage(m){reg.warn=m},showErrorMessage(m){reg.err=m},showInformationMessage(){}},
 env:{openExternal:async u=>{reg.opened.push(u.url)},asExternalUri:async u=>u}};
const orig=Module._load;Module._load=function(r,...a){return r==='vscode'?vscode:orig.call(this,r,...a)};
const extMod=require(path.join(__dirname,'..','vscode-extension','extension.js'));
const prepends=[];const ctxo=()=>({subscriptions:[],globalState:{get:()=>false,update(){}},environmentVariableCollection:{prepend:(k,v)=>prepends.push([k,v]),set description(v){}}});
extMod.activate(ctxo());
let fail=0;const ok=(c,m)=>{console.log((c?'[ok] ':'[x]  ')+m);if(!c)fail++};
function doc(text,lang='gitml',fsPath='/tmp/x.'+lang){const lines=text.split('\n');const off=p=>lines.slice(0,p.line).reduce((a,l)=>a+l.length+1,0)+p.character;
 return{languageId:lang,uri:{scheme:'file',fsPath,toString:()=>fsPath},lineCount:lines.length,isDirty:false,save:async()=>true,
 lineAt:p=>{const i=typeof p==='number'?p:p.line;return{text:lines[i],range:new Range(i,0,i,lines[i].length),firstNonWhitespaceCharacterIndex:0}},
 getText:r=>r?text.slice(off(r.start),off(r.end)):text,offsetAt:off,
 positionAt:o=>{let l=0,a=0;while(l<lines.length-1&&a+lines[l].length+1<=o){a+=lines[l].length+1;l++}return new Pos(l,o-a)},
 getWordRangeAtPosition:(p)=>{const l=lines[p.line];let s=p.character,e=p.character;while(s>0&&/[\w-]/.test(l[s-1]))s--;while(e<l.length&&/[\w-]/.test(l[e]))e++;return s===e?undefined:new Range(p.line,s,p.line,e)}}}
const at=(t,c,lang)=>{const d=doc(t,lang);const L=t.split('\n');return reg.comp.provideCompletionItems(d,new Pos(L.length-1,L[L.length-1].length))};
ok(Array.isArray(reg.compLangs)&&reg.compLangs.includes('html'),'autocompletar registrado para gitml E html');
let r=at('<her');ok(r.some(i=>i.label==='hero')&&r.length>150,'gitml: sugere tags ('+r.length+')');
ok(at('<html lang="').map(i=>i.label).join()==='pt-BR,en,es','valores de lang no <html>');
r=at('<head>\n<link rel="');ok(r&&r.some(i=>i.label==='stylesheet'),'link rel=… sugere stylesheet/icon');
r=at('<head>\n<meta ');ok(r.some(i=>i.label==='content')&&r.some(i=>i.label==='name'),'meta sugere name/content');
// dentro do HTML
const h1='<!DOCTYPE html>\n<html>\n<body>\n<script type="text/gitml">\n<gitml theme="';
r=at(h1,0,'html');ok(r&&r.map(i=>i.label).join()==='dark,light,auto','HTML: valores de theme dentro do bloco text/gitml');
const h2='<!DOCTYPE html>\n<html>\n<body>\n<script type="text/gitml">\n<her';
r=at(h2,0,'html');ok(r&&r.some(i=>i.label==='hero'),'HTML: sugere <hero> dentro do bloco');
const h3='<!DOCTYPE html>\n<html>\n<body>\n<script type="text/gitml">\n</script>\n<her';
ok(at(h3,0,'html')===undefined,'HTML: fora do bloco NÃO interfere (deixa o HTML cuidar)');
const hv=reg.hover.provideHover(doc('<script type="text/gitml">\n<hero title="a">\n</script>','html'),new Pos(1,2));ok(hv&&/hero/.test(hv.m.v),'HTML: hover dentro do bloco');
// diagnósticos em HTML com offset de linha
const dd=doc('<!DOCTYPE html>\n<body>\n<script type="text/gitml">\n<gitml>\n<herro title="x"/>\n</gitml>\n</script>\n</body>','html');
vscode.workspace.textDocuments.push(dd);extMod.activate(ctxo());
const last=diagSets[diagSets.length-1];ok(last&&last.length===1&&last[0].range.start.line===4&&/herro/.test(last[0].message),'HTML: aviso aparece na linha certa do arquivo (linha 5)');
// auto-fechar em html
let ins=null;vscode.window.activeTextEditor={document:null,insertSnippet:(s,p)=>{ins=s.value}};
const hd=doc('<script type="text/gitml">\n<hero title="x">','html');vscode.window.activeTextEditor.document=hd;
reg.changeHandlers.slice(-1)[0]({document:hd,reason:undefined,contentChanges:[{text:'>',rangeLength:0,range:new Range(1,15,1,15)}]});
ok(ins==='$0</hero>','HTML: fecha <hero> dentro do bloco');
ins=null;const hd2=doc('<script type="text/gitml">\n<head>\n<link rel="icon" href="a.png">','html');vscode.window.activeTextEditor.document=hd2;
reg.changeHandlers.slice(-1)[0]({document:hd2,reason:undefined,contentChanges:[{text:'>',rangeLength:0,range:new Range(2,28,2,28)}]});
ok(ins===null,'não fecha <link> dentro de <head>');
// comandos novos
ok(['gitml.openBrowser','gitml.serve','gitml.stopServer','gitml.serverMenu','gitml.preview','gitml.build','gitml.components','gitml.startTerminal'].every(c=>reg.cmds[c]),'8 comandos registrados');
// abrir no navegador de verdade: sobe o servidor e abre a URL
const PROJ=path.join(os.tmpdir(),'gitml-ext-test');fs.mkdirSync(PROJ,{recursive:true});fs.writeFileSync(path.join(PROJ,'index.gitml'),'<gitml title="T"><hero title="Oi"></hero></gitml>');
vscode.window.activeTextEditor={document:doc('<gitml/>','gitml',path.join(PROJ,'index.gitml'))};
(async()=>{await reg.cmds['gitml.openBrowser']();
 const u=reg.opened[0];ok(/^http:\/\/localhost:\d+\/$/.test(u),'openBrowser abriu '+u);
 const res=await fetch(u);const body=await res.text();ok(res.headers.get('content-type').startsWith('text/html')&&/g-hero/.test(body),'servidor devolve a página renderizada (não download)');
 const raw=await fetch(u+'index.gitml');ok(raw.headers.get('content-type').startsWith('text/html')&&/g-hero/.test(await raw.text()),'/index.gitml também abre como página');
 await reg.cmds['gitml.stopServer']();let down=false;try{await fetch(u)}catch(e){down=true}ok(down,'stopServer encerra o servidor');
 ok(prepends.length>0&&prepends[0][0]==='PATH'&&/[\\/]bin[\\/:;]?$/.test(prepends[0][1].replace(/[:;]$/,'')+''),'PATH recebe a pasta bin da extensão (comando gitml no terminal): '+(prepends[0]||[]).join(' '));
vscode.window.activeTextEditor={document:doc('<gitml/>','gitml',path.join(PROJ,'index.gitml'))};
reg.cmds['gitml.startTerminal']();
ok(reg.term&&reg.term.opts.cwd===PROJ&&/node ".*bin\/gitml\.js" start$/.test(reg.term.sent[0]),'startTerminal abre terminal na pasta do projeto e roda: '+(reg.term&&reg.term.sent[0]));
console.log(fail?'FALHAS '+fail:'EXTENSÃO OK');process.exit(fail?1:0)})();
