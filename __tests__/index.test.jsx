import { render, screen } from "@testing-library/react";
import Home from "../pages/index";
import "@testing-library/jest-dom";

describe("Home", () => {
  it("Renders button without crashing", () => {
    render(<Home />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("Renders button correctly", () => {
    render(<Home />);
    expect(screen.getByRole("button")).toHaveTextContent("Go to Music Profile");
  });
});
