# Austin baby names

Interactive baby-name trends for Austin, 2017–2024, and a rank comparison with Texas in 2024.

Published pages:
- https://gabriel-product-kut.github.io/austin-baby-names/embed-bubbles.html
- https://gabriel-product-kut.github.io/austin-baby-names/embed-texas.html
- https://gabriel-product-kut.github.io/austin-baby-names/embed-table.html

## Rebuild

Run from this repository with R packages readr, readxl, dplyr, tidyr, stringr, stringi, jsonlite and packcircles installed:

```sh
BABY_NAMES_DATA_DIR=/path/to/original/data Rscript --vanilla 03_build_html.R
```

The input folder must contain the Austin 2017 CSV, the 2018–2024 workbooks and Texas_baby_names.xlsx. Original source files remain outside the repository. The 2021 file ending in ' 1.xlsx' is an identical backup and is not imported.

The 2017 CSV provides weighted occurrence counts; later years provide individual records on their year-named worksheets. Unspecified sex, blank names and placeholder/header names are excluded. Case, accents, punctuation and whitespace are normalized for grouping, with original spellings retained for detail panels. Distinct spellings such as Sophia and Sofia remain distinct. Ranks use competition ranking for tied counts. Rates use eligible births within the same year and sex; Everyone combines both sexes. Trends include absent years as zero. Texas ranks come from the supplied top-100 lists; names outside them remain unranked. Grouped Texas formatting variants use the best listed rank and summed listed counts, without extrapolating beyond the source top 100.

The build writes reconciliation totals and aggregate CSVs to ignored build/. Generated self-contained HTML is committed in docs/. GitHub Actions deploys only docs/; it does not rerun the data build or need access to original records.

## Grove

Paste the snippets in grove/ into Grove's HTML embed fields. Both iframe URLs and the parent's message-origin checks use gabriel-product-kut.github.io. The child messages retain embed='austin-baby-names', their filename slug, and measured body height. The top-100 table provides a JavaScript-free fallback.
