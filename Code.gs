// 「おすすめ一覧」シートの公開可能な10列だけをJSONPで返します。
// 公開データだけを置いてください。API URLを知る人は誰でも取得できます。
function doGet(e) {
  const callback = String((e && e.parameter && e.parameter.callback) || '');
  if (!/^portalCallback_[A-Za-z0-9_]+$/.test(callback)) {
    return ContentService.createTextOutput('Invalid callback')
      .setMimeType(ContentService.MimeType.TEXT);
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('おすすめ一覧');
  if (!sheet) return ContentService.createTextOutput('/* sheet not found */');
  const rows = sheet.getDataRange().getDisplayValues().slice(1);
  const data = rows.filter(r => r[2] && r[2].trim()).map((r, i) => ({
    id: i + 1,
    date: toMonth(r[0], r[1]),
    title: r[2] || '',
    author: r[3] || '',
    illustrator: r[4] || '',
    label: r[5] || '',
    genre: r[6] || '',
    publication: r[7] || '',
    status: /打ち切り/.test(r[7]) ? '打ち切り' : /完結/.test(r[7]) ? '完結' : /継続/.test(r[7]) ? '継続' : 'その他',
    bookwalker: r[8] || '',
    amazon: r[9] || ''
  }));
  const output = callback + '(' + JSON.stringify(data).replace(/</g, '\\u003c') + ');';
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function toMonth(year, month) {
  const y = parseInt(String(year).replace(/[^0-9]/g, ''), 10);
  const m = parseInt(String(month).replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return '';
  const fullYear = y < 100 ? 2000 + y : y;
  return fullYear + '-' + String(m).padStart(2, '0');
}
