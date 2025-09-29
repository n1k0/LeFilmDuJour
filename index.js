import movies from "./db.json" with { type: "json" };
import fs from "node:fs/promises";
import path from "path";
import { createRestAPIClient } from "masto";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.URL) {
  throw new Error("URL is missing");
}
if (!process.env.TOKEN) {
  throw new Error("TOKEN is missing");
}

const client = createRestAPIClient({
  url: process.env.URL,
  accessToken: process.env.TOKEN,
});

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
    movie.alternateName
      ? `${movie.alternateName} (${movie.name} | ${movie.year} | ${formatDuration(movie.duration)})\n`
      : `${movie.name} (${movie.year} | ${formatDuration(movie.duration)})\n`,
    `${movie.description}\n`,
    `${movie.rating}/10 - ${movie.genre} - ${movie.contentRating} #seance21h`,
    `${movie.url}`,
  ].join("\n");
}

async function tootMovieOfTheDay(date) {
  const randomMovie = pick(date);
  const tootText = format(randomMovie);

  const imageFile = await fs.readFile(path.join(process.cwd(), "img", `${randomMovie.image}.jpg`));
  const attachment = await client.v2.media.create({
    file: new Blob([imageFile], { type: "image/jpeg" }),
    description: `Affiche du film ${randomMovie.alternateName}`,
  });

  const { url } = await createToot({
    status: tootText,
    visibility: process.env.VISIBILITY || "direct",
    mediaIds: [attachment.id],
  });
  console.log(`Movie of the day posted:\n${tootText}\n${url}`);
}

async function createToot(params, retries = 3, backoff = 500) {
  const retryCodes = [408, 500, 502, 503, 504, 522, 524];
  try {
    return client.v1.statuses.create(params);
  } catch (err) {
    console.warn(err.message);
    if (retries > 0 && retryCodes.includes(err.statusCode || 503)) {
      setTimeout(() => {
        return createToot(params, retries - 1, backoff * 2);
      }, backoff);
    } else {
      throw err;
    }
  }
}

tootMovieOfTheDay(new Date());
