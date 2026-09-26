export const formatSingleTime = (time) => {
  if (!time) return "";

  const value = time.toString().trim();

  const parts = value.split(":");

  let hours = Number(parts[0]);
  const minutes = Number(parts[1] || 0);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return value;
  }

  const period =
    hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${hours}:${String(minutes).padStart(
    2,
    "0"
  )} ${period}`;
};


export const getBatchTiming = (batch) => {
  if (!batch) return "-";

  /*
    ALWAYS PREFER
    startTime + endTime
  */

  if (
    batch.startTime &&
    batch.endTime
  ) {
    return `${formatSingleTime(
      batch.startTime
    )} - ${formatSingleTime(
      batch.endTime
    )}`;
  }

  /*
    fallback only
  */

  return batch.batchTiming || "-";
};


export const getBatchLabel = (batch) => {
  if (!batch) return "Unnamed Batch";

  const timing =
    getBatchTiming(batch);

  return batch.name
    ? `${batch.name} (${timing})`
    : timing;
};