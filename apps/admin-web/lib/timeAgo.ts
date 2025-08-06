import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

let timeAgo: TimeAgo | null = null;

if (!timeAgo) {
  TimeAgo.addDefaultLocale(en);
  timeAgo = new TimeAgo("en-US");
}

export function getTimeAgo(date: Date) {
  return timeAgo!.format(date);
}
