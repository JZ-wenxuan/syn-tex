// index.js

// ******************************* Init Ace *******************************

const ace = require('brace');
require('brace/mode/latex');
 
const source = ace.edit('source');
source.session.setMode('ace/mode/latex');
source.setFontSize('14px');
source.session.setUseWrapMode(true);

// source.setOptions({
//   autoScrollEditorIntoView: true,
//   maxLines: 20
// });
source.renderer.setScrollMargin(10, 10, 10, 10);
const sourceSelection = source.getSelection();



// ***************************** Init MathJax *****************************

import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { CHTML } from 'mathjax-full/js/output/chtml.js';
import { browserAdaptor } from 'mathjax-full/js/adaptors/browserAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

const adaptor = browserAdaptor();
RegisterHTMLHandler(adaptor);

const tex = new TeX({packages: AllPackages.sort().join(', ').split(/\s*,\s*/)});
const chtml = new CHTML({fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2'});
const html = mathjax.document('', {InputJax: tex, OutputJax: chtml});


// **************************** Render Control ****************************

const preview = document.getElementById('preview');

let renderTime = 0;
let renderCount = 0;
let rendered = false;

function render() {
  let start = performance.now();
  let text = source.getValue();
  const node = html.convert(text, {
    display: true,
    em: 20,
    ex: 12,
    containerWidth: 80 * 16,
  });
  preview.innerHTML = '';
  preview.appendChild(node);
  preview.appendChild(chtml.styleSheet(html));
  index.length = text.length;
  index.fill(null);
  indexNode(node, 0, text.length);
  rendered = true;
  forwardSelection();
  renderTime = performance.now() - start;
}

async function sourceUpdate() {
  rendered = false;
  renderCount++;
  let renderId = renderCount;
  await new Promise(resolve => setTimeout(resolve, renderTime));
  if (renderCount === renderId) render();
}

source.addEventListener('change', sourceUpdate);


// ************************* Index Construction *************************


let index = [];

function indexNode(node, parentBegin, parentEnd) {
  let thisBegin, thisEnd;
  let realNode = false;
  let loc = node.getAttribute('beginloc');
  if (loc) {
    thisBegin = parseInt(loc);
    thisEnd = parseInt(node.getAttribute('endloc'));
    realNode = (thisBegin !== parentBegin || thisEnd !== parentEnd);
    if (realNode) {
      parentBegin = thisBegin;
      parentEnd = thisEnd;
    } else {
      node.removeAttribute('beginloc');
      node.removeAttribute('endloc');
    }
  }
  
  let childBegin = parentEnd;
  let childEnd = parentBegin;
  for (var i = 0; i < node.children.length; i++) {
    var child = node.children[i];
    [b, e] = indexNode(child, parentBegin, parentEnd);
    if (b < childBegin) childBegin = b;
    if (e > childEnd) childEnd = e;
  }
  
  if (realNode) {
    index.fill(node, thisBegin, childBegin);
    index.fill(node, childEnd, thisEnd);
    return [thisBegin, thisEnd];
  }

  return [childBegin, childEnd];
}


// ************************** User Interaction **************************


function positionToIndex(pos) {
  return source.getSession().getDocument().positionToIndex(pos);
}

function indexToPosition(i) {
  return source.getSession().getDocument().indexToPosition(i);
}

sourceSelection.addEventListener('changeCursor', forwardSelection)
sourceSelection.addEventListener('changeSelection', forwardSelection)
source.addEventListener('focus', forwardSelection);

let selectionBegin = 0;
let selectionEnd = 0;

function forwardSelection() {
  // unselectAllPreview();
  if (!rendered) return;
  let b = positionToIndex(sourceSelection.getSelectionLead());
  let e = positionToIndex(sourceSelection.getSelectionAnchor());
  if (b > e) [b, e] = [e, b]; else if (b === e) e++;
  for (let i = selectionBegin; i < b && i < selectionEnd; i++) {
    unselectPreviewNode(index[i]);
  }
  for (let i = b; i < selectionBegin && i < e; i++) {
    selectPreviewNode(index[i]);
  }
  for (let i = Math.max(e, selectionBegin); i < selectionEnd && i; i++) {
    unselectPreviewNode(index[i]);
  }
  for (let i = Math.max(selectionEnd, b); i < e; i++) {
    selectPreviewNode(index[i]);
  }
  selectionBegin = b;
  selectionEnd = e;
}

function getPreviewTarget(target) {
  while (target.nodeName !== 'DIV') {
    let beginLoc = target.getAttribute('beginloc');
    if (beginLoc) {
      return target;
    }
    target = target.parentElement;
  }
  return null;
}

function unselectAll() {
  for (let i = selectionBegin; i < selectionEnd; i++) {
    unselectPreviewNode(index[i]);
  }
}

function unselectPreviewNode(node) {
  if (node) node.style.backgroundColor = null;
}

function selectPreviewNode(node) {
  if (node) node.style.backgroundColor = '#ACCEF7';
}

let selectingPreview = false;
let anchorIndex = 0;

preview.addEventListener("mousedown", e => {
  // unselectAll();
  target = getPreviewTarget(e.target);
  if (!target) return;
  selectingPreview = true;
  anchorIndex = parseInt(target.getAttribute('beginloc'));
  // selectPreviewNode(target);
  // select in source
  let pos = indexToPosition(anchorIndex);
  source.clearSelection();
  sourceSelection.setSelectionAnchor(pos.row, pos.column);
  // source.focus();
});

preview.addEventListener("mouseup", e => {
  if (!selectingPreview) return;
  selectingPreview = false;
  target = getPreviewTarget(e.target);
  source.focus();
});

preview.addEventListener("mousemove", e => {
  if (selectingPreview) {
    let target = getPreviewTarget(e.target);
    if (target) {
      // selectPreviewNode(target);
      let b = parseInt(target.getAttribute('beginloc'));
      let e = parseInt(target.getAttribute('endloc'));
      let pos = indexToPosition(b);
      source.moveCursorTo(pos.row, pos.column);
    }
  } else {
    unselectAll();
    let target = getPreviewTarget(e.target);
    if (target) {
      selectPreviewNode(target);
      selectionBegin = parseInt(target.getAttribute('beginloc'));
      selectionEnd = parseInt(target.getAttribute('endloc'));
    }
  }
});

preview.addEventListener("mouseleave", e => {
  selectingPreview = false;
  forwardSelection();
});


// ************************ Start Rendering ************************

render();

