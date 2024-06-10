"use client";

const MainError = ({ error }: { error: Error }) => {
  return (
    <div>
      <p>{error.message}</p>
    </div>
  );
};

export default MainError;
