// index.js

// ******************************* Init Ace *******************************

const ace = require('brace');
require('brace/mode/latex');
// require('brace/theme/monokai');
 
const source = ace.edit('source');
source.session.setMode('ace/mode/latex');
source.setFontSize('14px');
source.session.setUseWrapMode(true);

// source.setOptions({
//   autoScrollEditorIntoView: true,
//   maxLines: 20
// });
// source.setTheme('ace/theme/monokai');
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
let index = [];

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

render();


async function sourceUpdate() {
  rendered = false;
  renderCount++;
  let renderId = renderCount;
  await new Promise(resolve => setTimeout(resolve, renderTime));
  if (renderCount === renderId) render();
}

source.addEventListener('change', sourceUpdate);


// ************************* Index Construction *************************

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
// sourceSelection.addEventListener('changeSelectionStyle', forwardSelection)
// sourceSelection.addEventListener('changeSelection', forwardSelection)
source.addEventListener('focus', forwardSelection);

function forwardSelection() {
  unselectPreview();
  if (!rendered) return;
  let i = positionToIndex(sourceSelection.getSelectionLead());
  let j = positionToIndex(sourceSelection.getSelectionAnchor());
  if (i > j) [i, j] = [j, i];
  for (; i <= j; i++) {
    let node = index[i];
    if (node) selectPreviewNode(node);
  }
}

// function backwardSelection() {

// }

function getPreviewTarget(target) {
  while (target.nodeName !== 'DIV') {
    let beginLoc = target.getAttribute('beginloc');
    if (beginLoc && beginLoc !== 'null') {
      return target;
    }
    target = target.parentElement;
  }
  return null;
}

let prev_target = null; 

function unselectPreview(target) {
  index.map(node => { if (node) node.style.backgroundColor = null; })
}

function selectPreviewNode(target) {
  if (!target) return;
  target.style.backgroundColor = '#ACCEF7';
  // target.style.transitionProperty = 'background-color'
  // target.style.transitionDuration = '.08s'
  prev_target = target;
}

preview.addEventListener("click", e => {
  unselectPreview();
  target = getPreviewTarget(e.target);
  if (!target) return;
  // selectPreviewNode(target);
  // select in source
  let pos = indexToPosition(target.getAttribute('beginloc'));
  source.clearSelection();
  source.moveCursorTo(pos.row, pos.column);
  source.focus();
});

preview.addEventListener("mousemove", e => {
  unselectPreview();
  selectPreviewNode(getPreviewTarget(e.target));
});

preview.addEventListener("mouseleave", e => {
  forwardSelection();
});
