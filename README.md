# [🔗SynTeX Editor🔗](https://ayassaka.github.io/syn-tex/)

## What is this?

An interactive LaTeX equation editor with **selection syncing**.

## How is this done?

This project is based on:

- [MathJax](https://www.mathjax.org/) with some [customization](https://github.com/Ayassaka/MathJax-src), which tracks TeX source location while compiling.
- [Ace Editor](https://ace.c9.io/), with great syntax highlighting support for LaTeX.

## TODO

- Backward selection should map to closed braces and environments.
- CSS work: resizable source and preview.
- Handle `\left` and `\right`.
- Retain the preview if compilation fails completely.
- Fix: fast dragging sometimes doesn't trigger backward selection.
- Testing: against different packages and environments.
