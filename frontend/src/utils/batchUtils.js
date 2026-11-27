
// ==========================================
// FORMAT SINGLE TIME
// ==========================================

export const formatSingleTime = (time) => {
  if (time === null || time === undefined || time === "") {
    return "";
  }

  const value = String(time).trim();

  // Supports 09:30 AM, 15:30 and 9:30
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
    if (hours < 1 || hours > 12) return value;
    period = existingPeriod;
  } else {
    period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
  }

  return `${hours}:${String(minutes).padStart(2, "0")} ${period}`;
};


// ==========================================
// FORMAT BATCH TIMING STRING
// ==========================================

export const formatBatchTimingString = (timing) => {
  if (!timing) return "-";

  return String(timing).replace(
    /(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi,
    (time) => formatSingleTime(time)
  );
};


// ==========================================
// GET COMPLETE BATCH TIMING
// ==========================================

export const getBatchTiming = (batch) => {
  if (!batch) return "-";

  // Prefer canonical startTime and endTime
  if (batch.startTime && batch.endTime) {
    return `${formatSingleTime(batch.startTime)} - ${formatSingleTime(
      batch.endTime
    )}`;
  }

  // Fallback to existing batchTiming
  if (batch.batchTiming) {
    return formatBatchTimingString(batch.batchTiming);
  }

  return "-";
};


// ==========================================
// REMOVE EMBEDDED TIMING FROM BATCH NAME
// ==========================================

export const normalizeBatchName = (name) => {
  if (!name) return "";

  let cleanName = String(name).trim();

  const timePattern =
    String.raw`\d{1,2}(?::\d{2})?\s*(?:AM|PM)`;

  // Remove complete time ranges
  const rangeRegex = new RegExp(
    `${timePattern}\\s*(?:to|-|–|—)\\s*${timePattern}`,
    "gi"
  );

  cleanName = cleanName.replace(rangeRegex, "");

  // Remove remaining standalone times such as 11 AM
  const singleTimeRegex = new RegExp(
    `\\b${timePattern}\\b`,
    "gi"
  );

  cleanName = cleanName.replace(singleTimeRegex, "");

  // Clean empty brackets and extra separators
  cleanName = cleanName
    .replace(/\(\s*\)/g, "")
    .replace(/\[\s*\]/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,)])/g, "$1")
    .replace(/,\s*,/g, ",")
    .replace(/\s*[-–—]\s*$/g, "")
    .trim();

  return cleanName;
};


// ==========================================
// GET COMPLETE BATCH LABEL
// ==========================================

export const getBatchLabel = (batch) => {
  if (!batch) return "Unnamed Batch";

  const originalName = String(
    batch.name || batch.code || ""
  ).trim();

  const timing = getBatchTiming(batch);

  // If timing is unavailable, preserve original name
  if (!timing || timing === "-") {
    return originalName || "Unnamed Batch";
  }

  const cleanName = normalizeBatchName(originalName);

  return cleanName
    ? `${cleanName} (${timing})`
    : timing;
};
