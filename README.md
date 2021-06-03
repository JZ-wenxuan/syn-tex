# [🔗SynTex Editor🔗](https://ayassaka.github.io/syn-tex/)

## What is this?

An interactive LaTeX equation editor with **selection syncing**.

## How is this done?

This project is based on:

- [MathJax](https://www.mathjax.org/) with some [customization](https://github.com/Ayassaka/MathJax-src), which tracks TeX source location while compiling.
- [Ace Editor](https://ace.c9.io/), with great syntax highlighting support for LaTeX.

## TODO

- Backward selection should map to closed braces and environments.
- Handle `\left` and `\right`.
- Further test against different packages and environments.
- Make source editor resizable.
- Make preview fit to container.
- Fix: dragging sometimes doesn't trigger backward selection.
