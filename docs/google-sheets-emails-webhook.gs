function doPost(e) {
  var body = JSON.parse(e.postData.contents || '{}');
  var secret = PropertiesService.getScriptProperties().getProperty('EMAIL_LIST_WEBHOOK_SECRET');

  if (!secret || body.secret !== secret) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, message: 'Unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var submission = body.submission || {};
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Emails');

  if (!sheet) {
    throw new Error('Missing "Emails" sheet');
  }

  sheet.appendRow([
    submission.createdAt || '',
    submission.id || '',
    submission.source || '',
    submission.pagePath || '',
    submission.email || '',
    submission.firstName || '',
    submission.lastName || '',
    submission.phone || '',
    submission.trainingGoal || '',
    submission.experienceLevel || '',
    submission.trainingDays || '',
    Array.isArray(submission.equipmentAccess) ? submission.equipmentAccess.join(', ') : '',
    submission.biggestChallenge || '',
    submission.referrer || '',
    submission.utmSource || '',
    submission.utmMedium || '',
    submission.utmCampaign || '',
    submission.utmContent || '',
    submission.utmTerm || '',
    submission.country || '',
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
