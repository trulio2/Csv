import React from 'react';

interface CsvCardProps {
  data: { [key: string]: string };
}

const CsvCard: React.FC<CsvCardProps> = ({ data }) => {
  return (
    <div className="csv-card">
      {Object.entries(data).map(([key, value], index) => (
        <div key={index}>
          <strong>{key}: </strong> {value}
        </div>
      ))}
    </div>
  );
};

export default CsvCard;
