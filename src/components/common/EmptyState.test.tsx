import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('기본 안내 메시지를 렌더링한다', () => {
    render(<EmptyState />);
    expect(screen.getByText('표시할 데이터가 없습니다.')).toBeInTheDocument();
  });

  it('전달된 메시지를 렌더링한다', () => {
    render(<EmptyState message="등록된 스타트업 포트폴리오가 없습니다." />);
    expect(screen.getByText('등록된 스타트업 포트폴리오가 없습니다.')).toBeInTheDocument();
  });
});
