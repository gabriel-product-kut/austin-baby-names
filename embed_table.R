table_css <- function() '.gv table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}.gv th,.gv td{padding:8px;border-bottom:1px solid var(--line);text-align:left}.gv td:last-child{text-align:right}.gv h2{margin-top:24px}'
table_body <- function(period) {
  escape <- function(x) gsub(">", "&gt;", gsub("<", "&lt;", gsub("&", "&amp;", x, fixed=TRUE), fixed=TRUE), fixed=TRUE)
  paste0('<h1>Austin’s most common baby names</h1><p class="standfirst">2017–2024 · City of Austin records</p>',
    paste(vapply(c(ALL="Everyone", FEMALE="Girls", MALE="Boys"), function(label) {
      sx <- names(which(c(ALL="Everyone", FEMALE="Girls", MALE="Boys") == label))
      d <- head(period[period$sex == sx, ], 100)
      paste0('<h2>',label,'</h2><table><thead><tr><th>Rank</th><th>Name</th><th>Babies</th></tr></thead><tbody>',
        paste0('<tr><td>',d$rank,'</td><td>',escape(d$name),'</td><td>',format(d$n,big.mark=",",trim=TRUE),'</td></tr>', collapse=""),
        '</tbody></table>')
    }, character(1)), collapse=""), '<p class="credit">Source: City of Austin.</p>')
}
