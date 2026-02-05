import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
  TableContainer,
  Paper
} from "@mui/material";

export default function VedicChartView({ chart }) {
  return (
    <>
      {/* <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Ascendant
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {chart.ascendant_sign}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Longitude: {chart.ascendant.longitude.toFixed(2)} deg
          </Typography>,
        </CardContent>
      </Card> */}

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 4fr) minmax(0, 8fr)",
          },
          alignItems: "start",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Houses
              </Typography>
              <Table size="small" aria-label="houses table" >
                <TableBody>
                  {Object.entries(chart.houses).map(([house, info]) => (
                    <TableRow key={house}>
                      <TableCell >
                        {house.replace("_", " ")}
                      </TableCell>
                      <TableCell >
                        {info.sign}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Grid container spacing={2}>
            {Object.entries(chart.planets).map(([planet, info]) => (
              <Grid item xs={12} md={6} key={planet}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {planet}
                      </Typography>
                      {info.speed < 0 && (
                        <Tooltip title="This planet appears to move backward from Earth's view, indicating inward or karmic influence.">
                          <Chip
                            label="Retrograde"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        </Tooltip>
                      )}
                    </Box>

                    <Typography variant="body2">
                      <strong>Sign:</strong> {info.sign}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Nakshatra:</strong> {info.nakshatra.name} (Pada{" "}
                      {info.nakshatra.pada})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Longitude: {info.longitude.toFixed(2)} deg
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </>
  );
}
