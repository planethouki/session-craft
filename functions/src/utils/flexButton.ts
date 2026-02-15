import { FlexMessage, FlexButton, FlexBox } from "@line/bot-sdk";
import { InstrumentalParts, InstrumentalPart } from "../types/InstrumentalPart";

export function createPartsFlexMessage(title: string, selected: InstrumentalPart[], filter?: InstrumentalPart[], finishText: string = "選択終了"): FlexMessage {
  const partsToShow = filter || InstrumentalParts;

  const buttons: FlexButton[] = partsToShow.map(part => {
    const isSelected = selected.includes(part);
    return {
      type: "button",
      action: {
        type: "message",
        label: isSelected ? `[${part}]` : part,
        text: part,
      },
      style: isSelected ? "primary" : "secondary",
      margin: "sm",
      height: "sm",
    };
  });

  // 3列ずつに分ける
  const rows: FlexBox[] = [];
  for (let i = 0; i < buttons.length; i += 3) {
    rows.push({
      type: "box",
      layout: "horizontal",
      contents: buttons.slice(i, i + 3),
    });
  }

  return {
    type: "flex",
    altText: title,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: title,
            weight: "bold",
            size: "md",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: rows,
          },
          {
            type: "button",
            action: {
              type: "message",
              label: finishText,
              text: finishText,
            },
            style: "link",
            margin: "md",
          },
        ],
      },
    },
  };
}

export function createConfirmFlexMessage(title: string, summary: string): FlexMessage {
  return {
    type: "flex",
    altText: title,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: title,
            weight: "bold",
            size: "md",
          },
          {
            type: "text",
            text: summary,
            wrap: true,
            margin: "md",
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "xl",
            spacing: "md",
            contents: [
              {
                type: "button",
                action: {
                  type: "message",
                  label: "提出する",
                  text: "提出する",
                },
                style: "primary",
              },
              {
                type: "button",
                action: {
                  type: "message",
                  label: "やり直す",
                  text: "最初からやり直す",
                },
                style: "secondary",
              },
            ],
          },
        ],
      },
    },
  };
}
