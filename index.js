const movies = require("./db.json");

function dayOfYear(date) {
  return Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
}

function pick(date) {
  return movies[dayOfYear(date) % movies.length];
}

function formatDuration(duration) {
  return duration.replace("PT", "").replace("H", "h").replace("M", "");
}

function format(movie) {
  return [
    `${movie.alternateName} (${movie.name} | ${movie.year} | ${formatDuration(movie.duration)})`,
    `${movie.description}`,
    `${movie.rating}/10 - ${movie.genre} - ${movie.contentRating}`,
    `${movie.url}`,
  ].join("\n");
}

const randomMovie = pick(new Date());
console.log(format(randomMovie));
