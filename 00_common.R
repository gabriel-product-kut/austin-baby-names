suppressPackageStartupMessages({
  library(readr); library(readxl); library(dplyr); library(tidyr)
  library(stringr); library(stringi)
})

PROJ_DIR <- normalizePath(getwd())
OUT_DIR <- file.path(PROJ_DIR, "build")
YEARS <- 2017:2024
DATA_DIR <- Sys.getenv("BABY_NAMES_DATA_DIR")
if (!nzchar(DATA_DIR) || !dir.exists(DATA_DIR)) {
  stop("Set BABY_NAMES_DATA_DIR to the folder containing the original Austin and Texas files.")
}
dir.create(OUT_DIR, recursive = TRUE, showWarnings = FALSE)
msg <- function(...) cat(sprintf(...), "\n")
title_case <- function(x) stri_trans_totitle(tolower(x))
canonical <- function(x) {
  x <- stri_trans_nfkc(str_squish(as.character(x)))
  x <- stri_trans_general(x, "Latin-ASCII")
  str_to_upper(str_remove_all(x, "[\\p{P}\\p{Z}\\s]+"))
}
stopifnot(canonical("JOSÉ") == canonical(" Jose "),
          canonical("Anne-Marie") == canonical("Anne Marie"),
          canonical("Sophia") != canonical("Sofia"))

load_year <- function(year) {
  if (year == 2017L) {
    x <- read_csv(file.path(DATA_DIR, "APH_Final_NRN_C320620-061826_2017.csv"),
                  show_col_types = FALSE)
    tibble(year = year, name_raw = as.character(x[["FIRST NAME"]]),
           sex = as.character(x[["SEX"]]), n = as.integer(x[["NUMBER OF OCCURRENCES"]]))
  } else {
    # The year-named sheet has individual records. Counts sheets are pivot tables.
    x <- read_xlsx(file.path(DATA_DIR, sprintf("APH_Final_NRN_C320620-061826_%d.xlsx", year)),
                   sheet = as.character(year))
    tibble(year = year, name_raw = as.character(x[[1]]),
           sex = as.character(x[[2]]), n = 1L)
  }
}
raw <- bind_rows(lapply(YEARS, load_year)) %>%
  mutate(name_raw = str_squish(name_raw), name_canon = canonical(name_raw),
         sex = recode(str_to_upper(str_squish(sex)), GIRL = "FEMALE", BOY = "MALE"))
stopifnot(all(!is.na(raw$n)), all(raw$n > 0))
eligible <- raw %>% filter(sex %in% c("FEMALE", "MALE"),
  !is.na(name_canon), !name_canon %in% c("", "MALE", "FEMALE", "INFANT", "UNKNOWN", "FIRSTNAME"))

display_names <- eligible %>% group_by(name_canon, name_raw) %>%
  summarise(births = sum(n), .groups = "drop") %>%
  arrange(name_canon, desc(births), name_raw) %>%
  group_by(name_canon) %>% slice_head(n = 1) %>% ungroup() %>%
  transmute(name_canon, name_display = title_case(name_raw))
austin <- eligible %>% group_by(year, sex, name_canon) %>%
  summarise(n = sum(n), .groups = "drop") %>% left_join(display_names, by = "name_canon")
all_names <- austin %>% group_by(year, name_canon, name_display) %>%
  summarise(n = sum(n), .groups = "drop") %>% mutate(sex = "ALL")
by_year <- bind_rows(austin, all_names) %>% group_by(year, sex) %>%
  mutate(rank = min_rank(desc(n)), rate = n / sum(n) * 1000) %>% ungroup() %>%
  transmute(year, sex, rank, name = name_display, name_canon, n, rate) %>%
  arrange(year, sex, rank, name_canon)
period <- bind_rows(austin, all_names) %>% group_by(sex, name_canon, name_display) %>%
  summarise(n = sum(n), .groups = "drop") %>% group_by(sex) %>%
  mutate(rank = min_rank(desc(n)), rate = n / sum(n) * 1000) %>% ungroup() %>%
  transmute(sex, rank, name = name_display, name_canon, n, rate) %>%
  arrange(sex, rank, name_canon)
texas <- bind_rows(lapply(YEARS, function(year) {
  x <- read_xlsx(file.path(DATA_DIR, "Texas_baby_names.xlsx"), sheet = as.character(year),
                 .name_repair = "minimal")
  bind_rows(
    tibble(year, sex = "MALE", tx_rank = as.integer(x[[1]]),
           name_canon = canonical(x[[2]]), tx_n = as.integer(x[[3]])),
    tibble(year, sex = "FEMALE", tx_rank = as.integer(x[[1]]),
           name_canon = canonical(x[[4]]), tx_n = as.integer(x[[5]])))
})) %>% filter(!is.na(name_canon), name_canon != "") %>%
  group_by(year, sex, name_canon) %>%
  summarise(tx_rank = min(tx_rank), tx_n = sum(tx_n), .groups = "drop")
variants <- eligible %>% group_by(name_canon, name_raw) %>%
  summarise(births = sum(n), .groups = "drop")

reconciliation <- raw %>% group_by(year) %>% summarise(source_births = sum(n), .groups = "drop") %>%
  left_join(eligible %>% group_by(year) %>% summarise(eligible_births = sum(n), .groups = "drop"), by = "year") %>%
  left_join(austin %>% group_by(year) %>% summarise(chart_births = sum(n), .groups = "drop"), by = "year") %>%
  mutate(excluded_births = source_births - eligible_births)
stopifnot(all(reconciliation$eligible_births == reconciliation$chart_births),
          nrow(reconciliation) == 8L,
          sum(period$n[period$sex == "ALL"]) == sum(austin$n),
          !anyDuplicated(by_year[c("year", "sex", "name_canon")]))
for (year in YEARS) {
  for (sx in c("FEMALE", "MALE", "ALL")) {
    stopifnot(isTRUE(all.equal(sum(by_year$rate[by_year$year == year & by_year$sex == sx]), 1000)))
  }
}
write_csv(austin, file.path(OUT_DIR, "austin_clean.csv"))
write_csv(by_year, file.path(OUT_DIR, "austin_by_year.csv"))
write_csv(period, file.path(OUT_DIR, "austin_period.csv"))
write_csv(texas, file.path(OUT_DIR, "texas_clean.csv"))
write_csv(variants, file.path(OUT_DIR, "name_variants.csv"))
write_csv(reconciliation, file.path(OUT_DIR, "reconciliation.csv"))
msg("Validated %s eligible Austin records across eight years", format(sum(austin$n), big.mark = ","))
