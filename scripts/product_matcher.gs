/*************************************************
 CONFIG
*************************************************/

const SOURCE_SPREADSHEET_ID =
  "19QQ_We1gQPXASRJ_MsRQq2WXCm0IfTaNzJh7mrZcvxE";

const SOURCE_SHEET_NAME = "Prodsizes";
const UI_SHEET_NAME = "Prodmap Search";

const MAX_RESULTS = 10;


/*************************************************
 MAIN SEARCH
*************************************************/

function searchProduct() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const uiSheet =
    ss.getSheetByName(UI_SHEET_NAME);

  const data = getCachedData();

  if (!data || data.length < 2) {
    uiSheet.getRange("A10")
      .setValue("NO DATA FOUND");
    return;
  }

  const headers =
    data[0].map(cleanText);

  const cols = {
    id: headers.indexOf("id"),
    category: headers.indexOf("category1"),
    brand: headers.indexOf("brand"),
    lp: headers.indexOf("lp"),
    prodname: headers.indexOf("prodname"),
    size: headers.indexOf("size"),
    size2: headers.indexOf("size2")
  };

  if (
    cols.id === -1 ||
    cols.prodname === -1
  ) {
    uiSheet.getRange("A10")
      .setValue("MISSING REQUIRED COLUMNS");
    return;
  }

  const input = {
    prodname: cleanText(
      uiSheet.getRange("B5").getValue()
    ),

    brand: cleanText(
      uiSheet.getRange("B6").getValue()
    ),

    category: cleanText(
      uiSheet.getRange("F5").getValue()
    ),

    size: normalizeSize(
      uiSheet.getRange("F6").getValue()
    )
  };

  if (!input.prodname) {
    uiSheet.getRange("A10")
      .setValue("ENTER PRODUCT NAME");
    return;
  }

  uiSheet.getRange("A10:H30")
    .clearContent();

  const inputTokens =
    tokenize(input.prodname);

  let matches = [];

  for (let i = 1; i < data.length; i++) {

    const row = data[i];

    const product = {
      id: row[cols.id],
      category: row[cols.category],
      brand: row[cols.brand],
      lp: row[cols.lp],
      prodname: row[cols.prodname],
      size: row[cols.size],
      size2: row[cols.size2]
    };

    const clean = {
      prodname: cleanText(product.prodname),
      brand: cleanText(product.brand),
      category: cleanText(product.category),
      size: normalizeSize(product.size)
    };

    /**********************************************
     HARD FILTERS
    **********************************************/

    const tokenHit =
      inputTokens.some(token =>
        clean.prodname.includes(token)
      );

    if (!tokenHit) continue;

    if (input.brand && clean.brand) {

      const brandScore =
        similarity(
          input.brand,
          clean.brand
        );

      if (brandScore < 0.3) continue;
    }

    if (
      input.prodname.length > 5 &&
      Math.abs(
        clean.prodname.length -
        input.prodname.length
      ) > 25
    ) {
      continue;
    }

    /**********************************************
     EXACT MATCH
    **********************************************/

    const exactMatch =

      input.prodname === clean.prodname &&

      (!input.brand ||
        input.brand === clean.brand) &&

      (!input.category ||
        input.category === clean.category) &&

      (!input.size ||
        input.size === clean.size);

    let score = 0;

    if (exactMatch) {

      score = 100;

    } else {

      /********************************************
       PRODNAME SCORE
      ********************************************/

      if (input.prodname && clean.prodname) {

        const sim =
          tokenSimilarity(
            input.prodname,
            clean.prodname
          );

        score += Math.round(sim * 45);

        if (
          clean.prodname.includes(
            input.prodname
          )
        ) {
          score += 10;
        }
      }

      /********************************************
       BRAND SCORE
      ********************************************/

      if (input.brand && clean.brand) {

        const sim =
          similarity(
            input.brand,
            clean.brand
          );

        score += Math.round(sim * 25);

        if (sim < 0.4) {
          score -= 10;
        }
      }

      /********************************************
       CATEGORY SCORE
      ********************************************/

      if (
        input.category &&
        clean.category
      ) {

        const sim =
          similarity(
            input.category,
            clean.category
          );

        score += Math.round(sim * 15);

        if (sim >= 0.9) {
          score += 5;
        }

        if (sim < 0.4) {
          score -= 10;
        }
      }

      /********************************************
       SIZE SCORE
      ********************************************/

      if (input.size && clean.size) {

        const sim =
          similarity(
            input.size,
            clean.size
          );

        score += Math.round(sim * 15);

        if (input.size === clean.size) {
          score += 10;
        }

        if (sim < 0.4) {
          score -= 10;
        }
      }

      score =
        Math.max(
          0,
          Math.min(score, 99)
        );
    }

    /**********************************************
     SAVE MATCH
    **********************************************/

    if (score >= 30) {

      matches.push([
        score + "%",
        product.id,
        product.category,
        product.brand,
        product.lp,
        product.prodname,
        product.size,
        product.size2
      ]);
    }
  }

  /*************************************************
   SORT + LIMIT
  *************************************************/

  matches.sort((a, b) =>
    parseInt(b[0]) - parseInt(a[0])
  );

  matches =
    matches.slice(0, MAX_RESULTS);

  /*************************************************
   WRITE RESULTS
  *************************************************/

  if (matches.length > 0) {

    uiSheet
      .getRange(
        10,
        1,
        matches.length,
        8
      )
      .setValues(matches);

  } else {

    uiSheet.getRange("A10")
      .setValue("NO MATCHES FOUND");
  }
}


/*************************************************
 ADD TO NEW
*************************************************/

function addToNew() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const uiSheet =
    ss.getSheetByName(UI_SHEET_NAME);

  const newSheet =
    ss.getSheetByName("New");

  newSheet.appendRow([

    uiSheet.getRange("B6").getValue(),
    uiSheet.getRange("F5").getValue(),
    uiSheet.getRange("B5").getValue(),
    uiSheet.getRange("F6").getValue(),
    new Date()
  ]);
}


/*************************************************
 CLEAR SEARCH
*************************************************/

function clearSearch() {

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(UI_SHEET_NAME);

  sheet.getRange("B5:B6")
    .clearContent();

  sheet.getRange("F5:F6")
    .clearContent();

  sheet.getRange("A10:H30")
    .clearContent();
}


/*************************************************
 TOKEN SIMILARITY
*************************************************/

function tokenSimilarity(input, target) {

  const inputTokens =
    tokenize(input);

  const targetTokens =
    tokenize(target);

  if (
    !inputTokens.length ||
    !targetTokens.length
  ) {
    return 0;
  }

  let matched = 0;

  targetTokens.forEach(targetToken => {

    let best = 0;

    inputTokens.forEach(inputToken => {

      if (inputToken === targetToken) {
        best = 1;

      } else if (

        inputToken.includes(targetToken) ||
        targetToken.includes(inputToken)

      ) {
        best = Math.max(best, 0.7);
      }
    });

    matched += best;
  });

  return Math.min(
    matched / targetTokens.length,
    1
  );
}


/*************************************************
 SIMILARITY
*************************************************/

function similarity(a, b) {

  if (!a || !b) return 0;

  if (
    Math.abs(a.length - b.length) > 15
  ) {
    return 0;
  }

  if (a === b) return 1;

  if (
    a.includes(b) ||
    b.includes(a)
  ) {
    return 0.9;
  }

  const aTokens = a.split(" ");
  const bTokens = b.split(" ");

  let matches = 0;

  aTokens.forEach(token => {
    if (bTokens.includes(token)) {
      matches++;
    }
  });

  const tokenScore =
    matches /
    Math.max(
      aTokens.length,
      bTokens.length
    );

  if (
    Math.abs(a.length - b.length) > 8 ||
    tokenScore < 0.3
  ) {
    return tokenScore;
  }

  const longer =
    a.length > b.length ? a : b;

  const shorter =
    a.length > b.length ? b : a;

  return (

    longer.length -

    editDistance(
      longer,
      shorter
    )

  ) / longer.length;
}


/*************************************************
 EDIT DISTANCE
*************************************************/

function editDistance(a, b) {

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {

    for (let j = 1; j <= a.length; j++) {

      if (
        b.charAt(i - 1) ===
        a.charAt(j - 1)
      ) {

        matrix[i][j] =
          matrix[i - 1][j - 1];

      } else {

        matrix[i][j] = Math.min(

          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}


/*************************************************
 TOKENIZE
*************************************************/

function tokenize(text) {

  if (!text) return [];

  return [

    ...new Set(

      cleanText(text)
        .split(" ")
        .filter(Boolean)
    )
  ];
}


/*************************************************
 CLEAN TEXT
*************************************************/

function cleanText(text) {

  if (!text) return "";

  return text
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


/*************************************************
 NORMALIZE SIZE
*************************************************/

function normalizeSize(text) {

  if (!text) return "";

  return text
    .toString()
    .toLowerCase()

    .replace(/\u00A0/g, " ")
    .replace(/[-_]/g, " ")

    .replace(/liters?/g, "l")
    .replace(/litres?/g, "l")

    .replace(/milliliters?/g, "ml")
    .replace(/millilitres?/g, "ml")

    .replace(/packs?/g, "pack")

    .replace(/\s+/g, "")
    .trim();
}


/*************************************************
 LOAD DATA
*************************************************/

function getCachedData() {

  const sourceSS =
    SpreadsheetApp.openById(
      SOURCE_SPREADSHEET_ID
    );

  const sourceSheet =
    sourceSS.getSheetByName(
      SOURCE_SHEET_NAME
    );

  return sourceSheet
    .getDataRange()
    .getValues();
}
