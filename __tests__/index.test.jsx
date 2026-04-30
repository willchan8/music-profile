import { render, screen } from "@testing-library/react";
import Home from "../pages/index";
import "@testing-library/jest-dom";

describe("Home", () => {
  it("Renders CTA link without crashing", () => {
    render(<Home />);
    expect(screen.getByText("View My Profile")).toBeInTheDocument();
  });

  it("Renders CTA link with correct text", () => {
    render(<Home />);
    expect(screen.getByText("View My Profile")).toBeInTheDocument();
  });
});
