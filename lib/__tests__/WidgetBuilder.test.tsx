import { StrictMode, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WidgetBuilder } from "@/app/components/WidgetBuilder";

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");

afterEach(() => {
  if (originalShowModal) Object.defineProperty(HTMLDialogElement.prototype, "showModal", originalShowModal);
  else delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, "close", originalClose);
  else delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
});

function Harness() {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(true)}>Get widget</button>
    {open && <WidgetBuilder initialServices={["glm53"]} onClose={() => setOpen(false)} />}
  </>;
}

describe("WidgetBuilder dialog", () => {
  it("stays open through Strict Mode's effect replay, then closes and reopens", () => {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); },
    });
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.removeAttribute("open");
        this.dispatchEvent(new Event("close"));
      },
    });

    render(<StrictMode><Harness /></StrictMode>);
    fireEvent.click(screen.getByRole("button", { name: "Get widget" }));
    expect(screen.getByRole("dialog")).toHaveAttribute("open");

    fireEvent.click(screen.getByRole("button", { name: "Close widget dialog" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Get widget" }));
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });
});
