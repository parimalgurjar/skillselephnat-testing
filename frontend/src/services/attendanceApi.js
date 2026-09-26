import api from "./api";

/* =====================================================
   STUDENT - GET OWN ATTENDANCE
===================================================== */

export const getMyAttendance = async () => {
  try {
    const response = await api.get(
      "/attendance/my-attendance"
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to fetch attendance"
    );
  }
};

/* =====================================================
   ADMIN / TEACHER - GET ACCESSIBLE BATCHES

   ADMIN:
   All active batches

   TEACHER:
   Only assigned attendance batches
===================================================== */

export const getAttendanceBatches = async () => {
  try {
    const response = await api.get(
      "/attendance/my-batches"
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to fetch attendance batches"
    );
  }
};

/* =====================================================
   ADMIN / TEACHER - GET STUDENTS FOR ATTENDANCE

   Params:
   - batchId
   - date
===================================================== */

export const getStudentsForAttendance =
  async ({
    batchId,
    date,
  }) => {
    try {
      const response = await api.get(
        "/attendance/my-students",
        {
          params: {
            batchId,
            date,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Unable to fetch students"
      );
    }
  };

/* =====================================================
   ADMIN / TEACHER - MARK BULK ATTENDANCE

   Payload:
   {
     batchId,
     date,
     attendance: [
       {
         studentId,
         status
       }
     ]
   }
===================================================== */

export const markAttendance = async (
  attendanceData
) => {
  try {
    const response = await api.post(
      "/attendance/mark",
      attendanceData
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to save attendance"
    );
  }
};

/* =====================================================
   ADMIN - GET ATTENDANCE STATS

   Optional:
   - date
===================================================== */

export const getAttendanceStats = async (
  date
) => {
  try {
    const response = await api.get(
      "/attendance/stats",
      {
        params: date
          ? { date }
          : {},
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to fetch attendance statistics"
    );
  }
};

/* =====================================================
   ADMIN - GET ALL ATTENDANCE RECORDS

   Optional params:
   - batchId
   - date
   - search
===================================================== */

export const getAttendanceRecords =
  async (params = {}) => {
    try {
      const response = await api.get(
        "/attendance",
        {
          params,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Unable to fetch attendance records"
      );
    }
  };

/* =====================================================
   ADMIN / TEACHER - GET ATTENDANCE REPORT

   Required:
   - batchId
   - startDate
   - endDate
===================================================== */

export const getAttendanceReport =
  async ({
    batchId,
    startDate,
    endDate,
  }) => {
    try {
      const response = await api.get(
        "/attendance/report",
        {
          params: {
            batchId,
            startDate,
            endDate,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Unable to generate attendance report"
      );
    }
  };