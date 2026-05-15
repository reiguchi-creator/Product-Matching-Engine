# Product Matching Engine

A Google Apps Script-based fuzzy product matching system designed to improve product mapping workflows by automating search, normalization, and similarity scoring.

---

# Overview

This project was built to reduce manual effort in matching products across inconsistent datasets containing:

- product name variations
- brand inconsistencies
- category mismatches
- size formatting differences
- typographical errors

The system uses weighted similarity scoring and normalization techniques to identify the best product matches directly within Google Sheets.

---

# Features

## Fuzzy Product Matching
Uses token-based similarity scoring and edit-distance logic to identify probable matches even when product names are inconsistent.

Examples:
- "Coca Cola Zero 1L"
- "Coke Zero 1000ml"
- "Coca-Cola Zero"

can still produce strong match scores.

---

## Weighted Scoring Engine

Match confidence is calculated using weighted fields:

| Attribute | Weight |
|---|---|
| Product Name | 45 |
| Brand | 25 |
| Category | 15 |
| Size | 15 |

Exact matches automatically receive 100% confidence.

---

## Text Normalization

The engine standardizes:
- casing
- spacing
- special characters
- unit formats
- plural variations

Examples:
- liters → l
- milliliters → ml
- packs → pack

---

## Smart Filtering

Performance optimizations include:
- token pre-filtering
- length mismatch filtering
- early candidate rejection

These significantly reduce unnecessary similarity calculations.

---

## Google Sheets UI Integration

The system includes:
- product search interface
- ranked result display
- "Add to New" workflow
- quick search clearing

Built entirely inside Google Sheets using Google Apps Script.

---

# Tech Stack

- Google Apps Script
- JavaScript
- Google Sheets
- Fuzzy Matching Logic
- Levenshtein Distance
- Token Similarity Scoring

---

# Example Workflow

1. User enters product details
2. Script normalizes input data
3. Candidate products are filtered
4. Similarity scoring is applied
5. Top matches are ranked and displayed
6. New unmatched products can be added for review

---

# Example Use Cases

- Product catalog matching
- Retail SKU normalization
- Data cleaning workflows
- Inventory mapping
- Marketplace product reconciliation

---

# Future Improvements

Planned enhancements:
- synonym dictionary support
- caching optimization
- confidence explanations
- typo-learning system
- automated category suggestions

---

# Author

Built by Rei as part of a data automation and matching workflow project.
