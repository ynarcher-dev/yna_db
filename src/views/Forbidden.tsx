import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

/** 403 권한 부족 화면 (17_conventions.md 1장, 14_auth.md 14.5). */
export function Forbidden() {
  const navigate = useNavigate();
  return (
    <Result
      status="403"
      title="403"
      subTitle="이 페이지에 접근할 권한이 없습니다."
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          대시보드로 이동
        </Button>
      }
    />
  );
}
