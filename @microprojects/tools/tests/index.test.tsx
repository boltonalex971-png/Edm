import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import {SmartScroll, SmartScrollContent} from "../src/components/SmartScroll";

test('The button should have correct background color', async () => {
  render(<button title="Demo Button" />);
  const button = screen.getByText('Demo Button');
  expect(button).toHaveStyle({
    backgroundColor: '#ccc',
  });
});

test('SmartScroll should scroll correctly', async () => {
  render(
      <SmartScroll offtop={50}>
        <SmartScrollContent>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab aliquid, aspernatur, autem beatae commodi consequatur doloribus itaque nam natus nisi, possimus totam ut voluptatum! Nam odit reprehenderit rerum. Ab accusamus adipisci animi architecto atque commodi consectetur cumque dicta ducimus eum explicabo illum in laudantium magnam minima modi molestiae mollitia neque nesciunt, non omnis pariatur perferendis porro quae quas quo quos sed sint tempora unde ut veritatis voluptas voluptates. Accusantium amet architecto beatae consectetur enim est et ex excepturi facere harum labore modi necessitatibus nemo nostrum perferendis quos reiciendis, repellat tempora. Aspernatur commodi earum fuga illo impedit inventore laudantium nisi sit.
        </SmartScrollContent>
        <SmartScrollContent>
          Lorem ipsum dolor sit amet.
        </SmartScrollContent>
      </SmartScroll>
  )
})