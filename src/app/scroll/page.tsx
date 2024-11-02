"use client"

import React, { useEffect, useState } from 'react';

const ScrollTracker = () => {
    useEffect(() => {
        window.addEventListener("scroll", handleScroll, { passive: true, capture: true});
        return () => {
           window.removeEventListener("scroll", handleScroll);
        }
    }, []);

    const handleScroll = (e:any) => {
        console.log(e.target.scrollTop);
    }

  return (
    <div style={{ height: '4000px' }}>
      
      {/* Другой контент страницы */}
    </div>
  );
};

export default ScrollTracker;
