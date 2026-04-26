import React from "react";
import "./Introduction.css";

function Introduction() {
  return (
    <div className="introduction">
      <img
        src="https://ncch.gov.mn/Images/Museum/23/photo.jpg"
        alt="Музейн зураг"
        className="museum-image"
      />
      <p>
        Хэнтий аймгийн музей нь БНМАУ-ын Гэгээрлийн сайдын 1949 оны 04 дүгээр
        сарын 08-ны өдрийн 61 тоот тушаалаар “Орон нутгийг судлах кабинет”...
      </p>
    </div>
  );
}

export default Introduction;
