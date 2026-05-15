# Matching Algorithm Architecture

## Workflow

1. User enters:
   - Product Name
   - Brand
   - Category
   - Size

2. Script loads reference data from Prodsizes sheet

3. Data is cleaned and normalized

4. Hard filters applied:
   - Token filter
   - Brand similarity filter
   - Length filter

5. Similarity scoring:
   - Product Name = 45%
   - Brand = 25%
   - Category = 15%
   - Size = 15%

6. Top matches returned to UI sheet
