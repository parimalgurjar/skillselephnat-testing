import {
  Award,
  CheckCircle2,
  ClipboardCheck,
  TrendingUp,
  Target,
  Clock,
} from "lucide-react";

import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";

import "./MyPerformance.css";

const MyPerformance = () => {
  // Later backend API se actual data aayega
  const performance = {
    overallScore: 82,
    completedTasks: 12,
    totalTasks: 15,
    attendance: 86,
  };

  const recentPerformance = [
    {
      id: 1,
      title: "SEO Keyword Research",
      score: 90,
      status: "Excellent",
    },
    {
      id: 2,
      title: "Google Ads Campaign",
      score: 85,
      status: "Good",
    },
    {
      id: 3,
      title: "Meta Ads Strategy",
      score: 78,
      status: "Good",
    },
    {
      id: 4,
      title: "Content Marketing Task",
      score: 65,
      status: "Average",
    },
  ];

  const completionPercentage = Math.round(
    (performance.completedTasks / performance.totalTasks) * 100
  );

  const getStatusVariant = (status) => {
    if (status === "Excellent") return "success";
    if (status === "Good") return "primary";
    return "warning";
  };

  return (
    <div className="my-performance-page">
      <div className="performance-heading">
        <div>
          <h1>My Performance</h1>
          <p>
            Track your learning progress and overall performance.
          </p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="performance-stats-grid">
        <div className="performance-stat-card">
          <div className="performance-stat-icon score">
            <Award size={22} />
          </div>

          <div>
            <strong>{performance.overallScore}%</strong>
            <span>Overall Score</span>
          </div>
        </div>

        <div className="performance-stat-card">
          <div className="performance-stat-icon tasks">
            <ClipboardCheck size={22} />
          </div>

          <div>
            <strong>
              {performance.completedTasks}/{performance.totalTasks}
            </strong>
            <span>Tasks Completed</span>
          </div>
        </div>

        <div className="performance-stat-card">
          <div className="performance-stat-icon attendance">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <strong>{performance.attendance}%</strong>
            <span>Attendance</span>
          </div>
        </div>

        <div className="performance-stat-card">
          <div className="performance-stat-icon progress">
            <TrendingUp size={22} />
          </div>

          <div>
            <strong>{completionPercentage}%</strong>
            <span>Task Progress</span>
          </div>
        </div>
      </div>

      <div className="performance-main-grid">
        {/* Overall Progress */}
        <Card
          title="Overall Progress"
          subtitle="Your current learning progress"
        >
          <div className="overall-progress-content">
            <div className="overall-score-circle">
              <div className="overall-score-inner">
                <strong>{performance.overallScore}%</strong>
                <span>Overall Score</span>
              </div>
            </div>

            <div className="progress-details">
              <div className="progress-item">
                <div className="progress-item-header">
                  <span>Task Completion</span>
                  <strong>{completionPercentage}%</strong>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${completionPercentage}%`,
                    }}
                  />
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-item-header">
                  <span>Attendance</span>
                  <strong>{performance.attendance}%</strong>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill attendance-fill"
                    style={{
                      width: `${performance.attendance}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Performance Status */}
        <Card
          title="Performance Status"
          subtitle="Your current learning level"
        >
          <div className="performance-status">
            <div className="performance-status-icon">
              <Target size={28} />
            </div>

            <h3>Great Progress!</h3>

            <p>
              You are performing well. Keep completing
              assignments and attending classes regularly
              to improve further.
            </p>

            <div className="performance-status-footer">
              <Clock size={15} />
              Updated based on latest activity
            </div>
          </div>
        </Card>
      </div>

      {/* Task Performance */}
      <div className="task-performance-section">
        <Card
          title="Recent Task Performance"
          subtitle="Your latest assignment scores"
        >
          <div className="performance-table-wrapper">
            <table className="performance-table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Score</th>
                  <th>Performance</th>
                </tr>
              </thead>

              <tbody>
                {recentPerformance.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>

                    <td>
                      <div className="score-cell">
                        <strong>{item.score}%</strong>

                        <div className="mini-progress">
                          <div
                            style={{
                              width: `${item.score}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td>
                      <Badge
                        variant={getStatusVariant(
                          item.status
                        )}
                      >
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MyPerformance;