
// Convert a single time into a consistent 12-hour AM/PM format.
export const formatSingleTime = (time) => {
  if (time === null || time === undefined || time === "") {
    return "";
  }

  const value = String(time).trim();

  // Supports both "03:30 PM" and "15:30".
  const match = value.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i
  );

  if (!match) return value;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const existingPeriod = match[3]?.toUpperCase();

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return value;
  }

  let period;

  if (existingPeriod) {
    // Explicit AM/PM means the hour is already in 12-hour format.
    if (hours < 1 || hours > 12) return value;

    period = existingPeriod;
  } else {
    // No suffix means the input is in 24-hour format.
    period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
  }

  return `${hours}:${String(minutes).padStart(2, "0")} ${period}`;
};


// Format time values inside a complete batch timing string.
// Example: "09:30 AM to 20:00" -> "9:30 AM to 8:00 PM"
export const formatBatchTimingString = (timing) => {
  if (!timing) return "-";

  return String(timing).replace(
    /(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi,
    (time) => formatSingleTime(time)
  );
};


// Get a consistently formatted batch timing.
export const getBatchTiming = (batch) => {
  if (!batch) return "-";

  if (batch.startTime && batch.endTime) {
    return `${formatSingleTime(batch.startTime)} - ${formatSingleTime(
      batch.endTime
    )}`;
  }

  if (batch.batchTiming) {
    return formatBatchTimingString(batch.batchTiming);
  }

  return "-";
};


// Get the complete batch label.
export const getBatchLabel = (batch) => {
  if (!batch) return "Unnamed Batch";

  const timing = getBatchTiming(batch);

  return batch.name
    ? `${batch.name} (${timing})`
    : timing;
};
