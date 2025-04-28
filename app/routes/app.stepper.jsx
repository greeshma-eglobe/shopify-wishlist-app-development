import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "@remix-run/react";
import { Button, InlineStack, Badge } from "@shopify/polaris";

const Stepper = ({ initialStep = 1 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const steps = [1, 2, 3, 4];

  const getStepFromPath = () => {
    const match = location.pathname.match(/\/app\/step(\d+)/);
    return match ? parseInt(match[1], 10) : initialStep;
  };

  const [currentStep, setCurrentStep] = useState(getStepFromPath());

  useEffect(() => {
    setCurrentStep(getStepFromPath());
  }, [location.pathname]);

  const handleStepClick = (step) => {
    navigate(`/app/step${step}`);
  };

  return (
    <InlineStack gap="400" align="center">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <Button
            variant={currentStep === step ? "primary" : "secondary"}
            onClick={() => handleStepClick(step)}
          >
            {step}
          </Button>
          {/* adds an arrow between step buttons but not after the last step */}
          {index !== steps.length - 1 && <Badge status="attention">→</Badge>}
        </React.Fragment>
      ))}
    </InlineStack>
  );
};

export default Stepper;
