import ErrorMessage from "../app/wallet/components/ErrorMessage";
import { render, screen } from "@testing-library/react";

test("renders error message component unchanged", async () => {
  const { container } = render(<ErrorMessage message='An Error' />);
  expect(container).toMatchSnapshot();
  expect(screen.getByRole("alert").innerText).toBe("An Error");
});
