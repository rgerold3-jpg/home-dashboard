const APP_TITLE = 'Mein Zuhause – Dashboard';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(APP_TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getDashboardData() {
  return {
    wetter: getWeather_(),
    nachrichten: getNews_(),
    gmail: getGmail_(),
    kalender: getCalendar_()
  };
}

function getWeather_() {
  const lat = 50.83;
  const lon = 6.98;
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Europe%2FBerlin&forecast_days=4';
  try {
    const r = UrlFetchApp.fetch(url, {muteHttpExceptions:true});
    return JSON.parse(r.getContentText());
  } catch (e) {
    return {error: 'Wetter konnte nicht geladen werden.'};
  }
}

function getNews_() {
  const rss = 'https://www.tagesschau.de/xml/rss2';
  try {
    const xml = UrlFetchApp.fetch(rss, {muteHttpExceptions:true}).getContentText();
    const doc = XmlService.parse(xml);
    const items = doc.getRootElement().getChild('channel').getChildren('item');
    return items.slice(0, 6).map(function(item) {
      return {
        title: item.getChildText('title') || '',
        link: item.getChildText('link') || '',
        date: item.getChildText('pubDate') || ''
      };
    });
  } catch (e) {
    return [];
  }
}

function getGmail_() {
  try {
    const threads = GmailApp.search('in:inbox', 0, 6);
    return threads.map(function(thread) {
      const messages = thread.getMessages();
      const m = messages[messages.length - 1];
      return {
        subject: m.getSubject() || '(Kein Betreff)',
        sender: m.getFrom() || '',
        date: m.getDate().toISOString(),
        unread: thread.isUnread()
      };
    });
  } catch (e) {
    return [{error: 'Gmail konnte nicht geladen werden.'}];
  }
}

function getCalendar_() {
  try {
    const cal = CalendarApp.getDefaultCalendar();
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return cal.getEvents(now, end).slice(0, 12).map(function(event) {
      return {
        title: event.getTitle() || '(Ohne Titel)',
        start: event.getStartTime().toISOString(),
        end: event.getEndTime().toISOString(),
        location: event.getLocation() || ''
      };
    });
  } catch (e) {
    return [{error: 'Kalender konnte nicht geladen werden.'}];
  }
}
