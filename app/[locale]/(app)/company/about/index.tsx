// https://mui.com/about/

"use client";

import Hero from "./Hero";
import JoinUs from "./JoinUs";
import Location from "./Location";
import Team from "./Team";
import Values from "./Values";

import Footer from "@/components/Footer";

import { Divider } from "@mui/material";

import type { OrganizationResponse } from "@/types/organizations";

interface AboutProps {
  organizations: OrganizationResponse[];
}

const About = ({ organizations }: AboutProps) => (
  <>
    <Hero />
    <Divider />
    <Values />
    <Divider />
    <Team organizations={organizations} />
    <Divider />
    {/* <Support />
    <Divider /> */}
    <Location organizations={organizations} />
    <Divider />
    <JoinUs />
    <Divider />
    <Footer />
  </>
);

export default About;
