import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Progress, Tag, Row, Col } from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { QUIZ_QUESTIONS, COURSE_META, calculateResult } from "../../constants/quizConfig";

function QuizStep({ question, selectedKey, onSelect }) {
  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: "#2c3e50", marginBottom: 8, textAlign: "center" }}>
        {question.title}
      </h2>
      <p style={{ color: "#666", fontSize: 16, textAlign: "center", marginBottom: 32 }}>
        {question.subtitle}
      </p>
      <Row gutter={[16, 16]} justify="center">
        {question.options.map((opt) => {
          const isSelected = selectedKey === opt.key;
          return (
            <Col key={opt.key} xs={24} sm={12}>
              <div
                onClick={() => onSelect(opt.key)}
                style={{
                  padding: 24,
                  borderRadius: 16,
                  border: isSelected ? "2px solid #00B4D8" : "2px solid #e8e8e8",
                  background: isSelected ? "#EBFBFF" : "white",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  height: "100%",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = "#00B4D8";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = "#e8e8e8";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    border: isSelected ? "2px solid #00B4D8" : "2px solid #ccc",
                    background: isSelected ? "#00B4D8" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {isSelected && <CheckCircleOutlined style={{ color: "white", fontSize: 14 }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#2c3e50" }}>{opt.label}</div>
                    <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{opt.description}</div>
                  </div>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}

function QuizResult({ slug, score }) {
  const navigate = useNavigate();
  const meta = COURSE_META[slug];
  if (!meta) return null;

  const maxPossible = QUIZ_QUESTIONS.length * 3;
  const matchPercent = Math.round((score / maxPossible) * 100);

  return (
    <div style={{ textAlign: "center", animation: "scaleIn 0.4s ease" }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%", background: "#EBFBFF",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 24px",
      }}>
        <TrophyOutlined style={{ fontSize: 36, color: "#00B4D8" }} />
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: "#2c3e50", marginBottom: 8 }}>
        Your Perfect Course
      </h2>
      <p style={{ color: "#666", marginBottom: 32 }}>
        Based on your answers, we recommend:
      </p>

      <div style={{
        maxWidth: 480, margin: "0 auto", padding: 32, borderRadius: 20,
        border: "2px solid #00B4D8", background: "#EBFBFF",
      }}>
        <Tag color="cyan" style={{ marginBottom: 12, fontSize: 13 }}>{matchPercent}% match</Tag>
        <h3 style={{ fontSize: 24, fontWeight: 700, color: "#2c3e50", marginBottom: 4 }}>
          {meta.name}
        </h3>
        <p style={{ color: "#666", marginBottom: 16 }}>{meta.tagline}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ color: "#888" }}>{meta.duration}</span>
          <span style={{ color: "#888" }}>{"\u20b9"}{meta.price.toLocaleString("en-IN")}</span>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
          {meta.highlights.map((h) => (
            <Tag key={h} style={{ background: "rgba(0,180,216,0.1)", border: "1px solid rgba(0,180,216,0.3)", color: "#0891b2" }}>
              {h}
            </Tag>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Button type="primary" size="large" onClick={() => navigate(`/courses/${slug}`)}>
            View Course Details <ArrowRightOutlined />
          </Button>
          <Button size="large" onClick={() => navigate("/allcourses")}>
            See All Courses
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SkillQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const totalSteps = QUIZ_QUESTIONS.length;
  const question = QUIZ_QUESTIONS[currentStep];

  const handleSelect = (key) => {
    setAnswers((prev) => ({ ...prev, [question.id]: key }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setResult(calculateResult(answers));
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
  };

  if (result) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", padding: "48px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", width: "100%" }}>
          <QuizResult slug={result.slug} score={result.score} />
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Button type="link" onClick={handleRestart}>Retake Quiz</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", padding: "48px 24px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", width: "100%" }}>
        <Progress
          percent={((currentStep + 1) / totalSteps) * 100}
          showInfo={false}
          strokeColor="#00B4D8"
          style={{ marginBottom: 8 }}
        />
        <div style={{ textAlign: "center", color: "#999", fontSize: 13, marginBottom: 32 }}>
          Step {currentStep + 1} of {totalSteps}
        </div>

        <QuizStep
          question={question}
          selectedKey={answers[question.id]}
          onSelect={handleSelect}
        />

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
          <Button
            onClick={handleBack}
            disabled={currentStep === 0}
            icon={<ArrowLeftOutlined />}
          >
            Back
          </Button>
          <Button
            type="primary"
            onClick={handleNext}
            disabled={!answers[question.id]}
          >
            {currentStep < totalSteps - 1 ? "Next" : "See My Result"} <ArrowRightOutlined />
          </Button>
        </div>
      </div>
    </div>
  );
}
