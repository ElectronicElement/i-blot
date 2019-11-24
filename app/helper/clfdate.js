var CLF_MONTH = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

function pad2(num) {
  var str = String(num);

  return (str.length === 1 ? "0" : "") + str;
}

function rpad3(num) {
  var str = String(num);

  if (str.length === 2) return str + "0";

  if (str.length === 1) return str + "00";

  return str;
}

module.exports = function clfdate() {
  dateTime = new Date();

  var date = dateTime.getDate();
  var hour = dateTime.getHours();
  var mins = dateTime.getMinutes();
  var secs = dateTime.getSeconds();
  var year = dateTime.getFullYear();
  var offset = dateTime.getTimezoneOffset() / 60;

  if (offset > 0) {
    offset = "-" + pad2(offset) + "00";
  } else {
    offset = "+" + pad2(offset) + "00";
  }

  var month = CLF_MONTH[dateTime.getMonth()];

  return (
    "[" +
    pad2(date) +
    "/" +
    month +
    "/" +
    year +
    ":" +
    pad2(hour) +
    ":" +
    pad2(mins) +
    ":" +
    pad2(secs) +
    " " +
    offset +
    "]"
  );
};
