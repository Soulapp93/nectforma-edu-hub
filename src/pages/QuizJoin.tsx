import React from 'react';
import { useSearchParams } from 'react-router-dom';
import QuizJoinScreen from '@/components/quiz/QuizJoinScreen';

const QuizJoin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const pinFromUrl = searchParams.get('pin') || '';

  return <QuizJoinScreen initialPin={pinFromUrl} onClose={() => window.history.back()} />;
};

export default QuizJoin;
