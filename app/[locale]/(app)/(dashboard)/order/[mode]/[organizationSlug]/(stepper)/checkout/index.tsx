import CustomerPaymentForm from "@/components/CustomerPaymentForm";
import CustomizedAccordions from "@/components/CustomizedAccordions";

import { Grid } from "@mui/material";

const OrderModeOrganizationSlugCheckout = () => (
  <Grid container spacing={2}>
    <Grid size={{ xs: 12, md: 6 }}>
      <CustomizedAccordions />
    </Grid>
    <Grid size={{ xs: 12, md: 6 }}>
      <CustomerPaymentForm />
    </Grid>
  </Grid>
);

export default OrderModeOrganizationSlugCheckout;
