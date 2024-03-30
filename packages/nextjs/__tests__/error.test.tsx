import ErrorMessage from "@/components/ErrorMessage";
import { render, screen } from "@testing-library/react";

describe("Error Message", () => {
  test("Should render ErrorMessage component unchanged", async () => {
    const { container } = render(<ErrorMessage message="An Error" />);
    expect(container).toMatchSnapshot();
    expect(screen.getByRole("alert").innerText).toBe("An Error");
  });
});
