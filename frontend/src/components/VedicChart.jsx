import { Card, Row, Col, Table, Badge, OverlayTrigger, Tooltip  } from "react-bootstrap";

export default function VedicChartView({ chart }) {
  return (
    <>
      <Card className="mb-3">
        <Card.Body>
          <Card.Title>Ascendant</Card.Title>
          <h5 className="mb-1">{chart.ascendant_sign}</h5>
          <small className="text-muted">
            Longitude: {chart.ascendant.longitude.toFixed(2)}°
          </small>
        </Card.Body>
      </Card>

      <Row>
        {/* Houses */}
        <Col md={4}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Houses</Card.Title>
              <Table size="sm" bordered>
                <tbody>
                  {Object.entries(chart.houses).map(([house, info]) => (
                    <tr key={house}>
                      <td>{house.replace("_", " ")}</td>
                      <td>{info.sign}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Planets */}
        <Col md={8}>
          <Row>
            {Object.entries(chart.planets).map(([planet, info]) => (
              <Col md={6} className="mb-3" key={planet}>
                <Card>
                  <Card.Body>
                    <Card.Title className="d-flex justify-content-between">
                      {planet}
                      {info.speed < 0 && (
                        <OverlayTrigger
                          overlay={
                            <Tooltip>
                              This planet appears to move backward from Earth’s
                              view, indicating inward or karmic influence.
                            </Tooltip>
                          }
                        >
                          <Badge bg="warning" text="dark">
                            Retrograde
                          </Badge>
                        </OverlayTrigger>
                      )}
                    </Card.Title>

                    <div>
                      <strong>Sign:</strong> {info.sign}
                    </div>

                    <div>
                      <strong>Nakshatra:</strong> {info.nakshatra.name} (Pada{" "}
                      {info.nakshatra.pada})
                    </div>

                    <div className="text-muted small">
                      Longitude: {info.longitude.toFixed(2)}°
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </>
  );
}
