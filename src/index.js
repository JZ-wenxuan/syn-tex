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
  index.length = text.length;
  index.fill(null);
  indexNode(node, 0);
  preview.appendChild(node);
  preview.appendChild(chtml.styleSheet(html));
  renderTime = performance.now() - start;
}

render();


async function sourceUpdate() {
  renderCount++;
  let renderId = renderCount;
  await new Promise(resolve => setTimeout(resolve, renderTime));
  if (renderCount === renderId) render();
}

source.addEventListener('change', sourceUpdate);


// ************************* Index Construction *************************

function indexNode(node, outerLoc) {
  for (var i = 0; i < node.childNodes.length; i++) {
    var child = node.childNodes[i];
    let loc = node.getAttribute('beginloc');
    if (loc) {
      loc = parseInt(loc);
      if (loc === outerLoc) {
        node.removeAttribute('beginloc');
        node.removeAttribute('endloc');
      } else {
        outerLoc = loc;
        index.fill(node, loc, parseInt(node.getAttribute('endloc')));
      }
    }
    indexNode(child, outerLoc);
  }
}


// ************************** User Interaction **************************

let sourceSelection = source.getSelection();

function positionToTarget(pos) {
  return index[source.getSession().getDocument().positionToIndex(pos)];
}

sourceSelection.addEventListener('changeCursor', () => {
  unselectPreview();
  let target = positionToTarget(sourceSelection.getCursor());
  if (target) selectPreview(target);
})

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
  if (prev_target) {
    prev_target.style.backgroundColor = null;
    // source.setSelectionRange(0, 0);
    prev_target = null;
  }
}

function selectPreview(target) {
  target = getPreviewTarget(target);
  if (!target) return;
//   source.setSelectionRange(
//     parseInt(target.getAttribute('beginloc')),
//     parseInt(target.getAttribute('endloc')),
//   );
  target.style.backgroundColor = '#ACCEF7';
  target.style.transitionProperty = 'background-color'
  target.style.transitionDuration = '.12s'
  prev_target = target;
}

preview.addEventListener("click", e => {
  unselectPreview();
  selectPreview(e.target);
//   source.focus();
});

preview.addEventListener("mousemove", e => {
  unselectPreview();
  selectPreview(e.target);
//   source.focus();
});

preview.addEventListener("mouseleave", e => {
  unselectPreview();
});
