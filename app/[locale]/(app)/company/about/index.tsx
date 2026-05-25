// https://mui.com/about/

"use client";

import Hero from "./Hero";
import JoinUs from "./JoinUs";
import Location from "./Location";
import Team from "./Team";
import Values from "./Values";

import Footer from "@/components/Footer";

import { Divider } from "@mui/material";

const About = () => (
  <>
    <Hero />
    <Divider />
    <Values />
    <Divider />
    <Team />
    <Divider />
    {/* <Support />
    <Divider /> */}
    <Location />
    <Divider />
    <JoinUs />
    <Divider />
    <Footer />
  </>
);

export default About;
