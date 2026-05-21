const bearerSecurity = [{ bearerAuth: [] }];

const objectIdExample = "665f2a7f2d7c4a0012a34567";

const userExample = {
  _id: objectIdExample,
  nid: "12-34-56-123456",
  FirstName: "Nabin",
  email: "nabin@example.com",
  phone: "9812345678",
  user_type: ["passenger"],
  isVerified: false,
  onBoard: false,
};

const nfcCardExample = {
  id: "665f2a7f2d7c4a0012a34568",
  _id: "665f2a7f2d7c4a0012a34568",
  cardUid: "AB****12",
  maskedCardUid: "AB****12",
  cardType: "personal",
  status: "active",
  isActive: true,
  isVerified: false,
  balance: 0,
};

const busExample = {
  _id: "665f2a7f2d7c4a0012a34569",
  plateNumber: "BA1CHA2345",
  busType: "standard",
  maxCapacity: 40,
  currentOccupancy: 0,
  status: "idle",
  currentLocation: {
    lat: 28.2096,
    lng: 83.9856,
    timestamp: "2026-05-22T10:00:00.000Z",
  },
};

const driverExample = {
  _id: "665f2a7f2d7c4a0012a34570",
  user: objectIdExample,
  operator: "665f2a7f2d7c4a0012a34571",
  assignedBus: "665f2a7f2d7c4a0012a34569",
  licenseNumber: "DL-2024-9999",
  licenseExpiry: "2027-01-01T00:00:00.000Z",
  status: "available",
};

const operatorExample = {
  _id: "665f2a7f2d7c4a0012a34571",
  owner: objectIdExample,
  companyName: "Sahaj Yatra Transport",
  totalBuses: 1,
  activeBuses: 0,
  totalRevenue: 0,
  isActive: true,
};

const transactionExample = {
  id: "665f2a7f2d7c4a0012a34572",
  txnId: "TXN-1716357600000-ABCD",
  date: "2026-05-22T10:00:00.000Z",
  type: "fare_debit",
  status: "completed",
  fareDebited: 20,
  amountCreditedUsingKhalti: 0,
  requiredTopup: 0,
  isAutoTopup: false,
  paymentMethod: "nfc_card",
  khalti: {
    pidx: null,
    transactionId: null,
    status: null,
    amount: 0,
    paymentUrl: null,
  },
};

const tapEventExample = {
  _id: "665f2a7f2d7c4a0012a34573",
  bus: "665f2a7f2d7c4a0012a34569",
  busPlate: "BA1CHA2345",
  eventType: "tap_in",
  status: "entry",
  success: true,
  message: "Entry recorded successfully",
  fare: 0,
};

const apiSuccess = (statusCode, data, message = "success") => ({
  statusCode,
  data,
  message,
  success: statusCode < 400,
});

const apiError = (message = "Something went wrong", errors = []) => ({
  success: false,
  message,
  errors,
});

const jsonResponse = (description, statusCode, example, schema = null) => ({
  description,
  content: {
    "application/json": {
      schema: schema || { $ref: "#/components/schemas/SuccessResponse" },
      examples: {
        success: {
          value: example,
        },
      },
    },
  },
});

const errorResponseRefs = {
  400: { $ref: "#/components/responses/BadRequest" },
  401: { $ref: "#/components/responses/Unauthorized" },
  403: { $ref: "#/components/responses/Forbidden" },
  404: { $ref: "#/components/responses/NotFound" },
  409: { $ref: "#/components/responses/Conflict" },
  429: { $ref: "#/components/responses/TooManyRequests" },
  500: { $ref: "#/components/responses/InternalServerError" },
  503: { $ref: "#/components/responses/ServiceUnavailable" },
};

const errorResponses = (codes = [400, 500]) =>
  codes.reduce((acc, code) => {
    acc[code] = errorResponseRefs[code];
    return acc;
  }, {});

const jsonRequest = (schemaRef, example, required = true) => ({
  required,
  content: {
    "application/json": {
      schema: { $ref: schemaRef },
      examples: {
        request: {
          value: example,
        },
      },
    },
  },
});

const objectIdParam = (name, description) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: {
    type: "string",
  },
  example: objectIdExample,
});

const queryParam = (name, description, schema, example) => ({
  name,
  in: "query",
  required: false,
  description,
  schema,
  example,
});

const operation = ({
  tags,
  summary,
  description,
  security = false,
  parameters = [],
  requestBody = null,
  successCode = 200,
  successDescription = "Successful request",
  successExample = apiSuccess(200, {}, "success"),
  successSchema = null,
  errors = [400, 500],
}) => ({
  tags: Array.isArray(tags) ? tags : [tags],
  summary,
  description,
  ...(security ? { security: bearerSecurity } : {}),
  ...(parameters.length ? { parameters } : {}),
  ...(requestBody ? { requestBody } : {}),
  responses: {
    [successCode]: jsonResponse(
      successDescription,
      successCode,
      successExample,
      successSchema,
    ),
    ...errorResponses(errors),
  },
});

const periodParameters = [
  queryParam(
    "period",
    "Analytics period. The controller supports day, week, month, and year.",
    { type: "string", enum: ["day", "week", "month", "year"] },
    "month",
  ),
  queryParam("from", "Optional ISO start date override.", { type: "string", format: "date-time" }, "2026-05-01T00:00:00.000Z"),
  queryParam("to", "Optional ISO end date override.", { type: "string", format: "date-time" }, "2026-05-22T23:59:59.000Z"),
];

const passengerRegisterBody = jsonRequest(
  "#/components/schemas/RegisterRequest",
  {
    nid: "12-34-56-123456",
    FirstName: "Nabin",
    email: "nabin@example.com",
    phone: "9812345678",
    password: "Password1",
  },
);

const loginBody = jsonRequest("#/components/schemas/LoginRequest", {
  email: "nabin@example.com",
  password: "Password1",
});

const registerPassengerOperation = operation({
  tags: ["Auth"],
  summary: "Register a passenger",
  description:
    "Creates a passenger user account. If the email matches ADMIN_EMAIL, the user is created as an admin according to the existing controller logic.",
  requestBody: passengerRegisterBody,
  successCode: 201,
  successDescription: "User registered successfully",
  successExample: apiSuccess(201, userExample, "User registered successfully"),
  errors: [400, 409, 500],
});

const loginPassengerOperation = operation({
  tags: ["Auth"],
  summary: "Login passenger or admin",
  description:
    "Authenticates a user by email and password. The controller returns access and refresh tokens and also sets HTTP-only cookies.",
  requestBody: loginBody,
  successExample: apiSuccess(
    200,
    {
      user: userExample,
      accessToken: "jwt-access-token-placeholder",
      refreshToken: "jwt-refresh-token-placeholder",
    },
    "Logged in successfully",
  ),
  errors: [400, 401, 404, 500],
});

const logoutOperation = operation({
  tags: ["Auth"],
  summary: "Logout current user",
  description: "Clears stored refresh token and auth cookies for the logged-in user.",
  security: true,
  successExample: apiSuccess(200, {}, "Logged out successfully"),
  errors: [401, 500],
});

const driverRegisterOperation = operation({
  tags: ["Auth", "Drivers"],
  summary: "Register a driver",
  description: "Creates a user account with driver role and a linked driver profile.",
  requestBody: jsonRequest("#/components/schemas/DriverRegisterRequest", {
    nid: "12-34-56-123456",
    FirstName: "Sita",
    email: "sita.driver@example.com",
    phone: "9812345678",
    password: "Password1",
    license_number: "DL-2024-9999",
    license_expiry: "2027-01-01",
  }),
  successCode: 201,
  successDescription: "Driver registered successfully",
  successExample: apiSuccess(
    201,
    { user: { ...userExample, user_type: ["driver"] }, driver: driverExample },
    "Driver registered successfully",
  ),
  errors: [400, 409, 500],
});

const driverLoginOperation = operation({
  tags: ["Auth", "Drivers"],
  summary: "Login driver",
  description: "Authenticates a driver account and returns tokens with the driver profile.",
  requestBody: loginBody,
  successExample: apiSuccess(
    200,
    {
      user: { ...userExample, user_type: ["driver"] },
      driver: driverExample,
      accessToken: "jwt-access-token-placeholder",
      refreshToken: "jwt-refresh-token-placeholder",
    },
    "Driver logged in successfully",
  ),
  errors: [400, 401, 403, 404, 500],
});

const operatorRegisterOperation = operation({
  tags: ["Auth", "Operators"],
  summary: "Register an operator",
  description: "Creates a user account with operator role and a linked operator company profile.",
  requestBody: jsonRequest("#/components/schemas/OperatorRegisterRequest", {
    nid: "12-34-56-123456",
    FirstName: "Ram",
    email: "ram.operator@example.com",
    phone: "9812345678",
    password: "Password1",
    company_name: "Sahaj Yatra Transport",
  }),
  successCode: 201,
  successDescription: "Operator registered successfully",
  successExample: apiSuccess(
    201,
    {
      user: { ...userExample, user_type: ["operator"] },
      operator: operatorExample,
    },
    "Operator registered successfully",
  ),
  errors: [400, 409, 500],
});

const operatorLoginOperation = operation({
  tags: ["Auth", "Operators"],
  summary: "Login operator",
  description: "Authenticates an operator account and returns tokens with the operator profile.",
  requestBody: loginBody,
  successExample: apiSuccess(
    200,
    {
      user: { ...userExample, user_type: ["operator"] },
      operator: operatorExample,
      accessToken: "jwt-access-token-placeholder",
      refreshToken: "jwt-refresh-token-placeholder",
    },
    "Operator logged in successfully",
  ),
  errors: [400, 401, 403, 404, 500],
});

const profileOperation = operation({
  tags: ["Users"],
  summary: "Get logged-in user profile",
  description:
    "Returns the logged-in user's profile together with their latest/default NFC card details. This route uses a custom response shape in the current code.",
  security: true,
  successExample: {
    success: true,
    user: {
      ...userExample,
      balance: 980,
      cardUid: "AB****12",
      maskedCardUid: "AB****12",
      nfcCardId: nfcCardExample._id,
      cardStatus: "active",
      cardType: "personal",
      isNfcCardActive: true,
      isNfcCardVerified: true,
      nfcCard: nfcCardExample,
    },
    message: "Profile successfully fetched",
  },
  successSchema: { type: "object", additionalProperties: true },
  errors: [401, 404, 500],
});

const registerNfcOperation = operation({
  tags: ["NFC Cards"],
  summary: "Register NFC card",
  description:
    "Registers an NFC card for the logged-in user. The card is created as unverified and must be verified by an admin before tap use.",
  security: true,
  requestBody: jsonRequest("#/components/schemas/NFCCardRegisterRequest", {
    cardUid: "ABCD1234",
    cardType: "personal",
  }),
  successCode: 201,
  successDescription: "NFC card registered",
  successExample: apiSuccess(
    201,
    nfcCardExample,
    "NFC card registered! Waiting for admin verification",
  ),
  errors: [400, 401, 403, 500],
});

const vehicleLocationOperation = operation({
  tags: ["Vehicles"],
  summary: "Update vehicle location",
  description: "Updates the latitude and longitude of a vehicle by bus ID.",
  security: true,
  parameters: [objectIdParam("busId", "Bus ID")],
  requestBody: jsonRequest("#/components/schemas/LocationUpdateRequest", {
    lat: 28.2096,
    lng: 83.9856,
  }),
  successExample: apiSuccess(
    200,
    {
      _id: busExample._id,
      currentLocation: busExample.currentLocation,
    },
    "Location updated",
  ),
  errors: [400, 401, 404, 500],
});

const paymentInitiateOperation = operation({
  tags: ["Payment", "Khalti"],
  summary: "Initiate Khalti payment for pending fare",
  description:
    "Starts a Khalti payment for a transaction whose status is payment_required or payment_initiated.",
  security: true,
  requestBody: jsonRequest("#/components/schemas/PaymentInitiateRequest", {
    txnId: "TXN-1716357600000-ABCD",
  }),
  successExample: apiSuccess(
    200,
    {
      payment_url: "https://pay.khalti.com/?pidx=example",
      txnId: "TXN-1716357600000-ABCD",
      pidx: "pidx-placeholder",
    },
    "Payment initiated successfully",
  ),
  errors: [400, 401, 403, 404, 500, 503],
});

const paymentVerifyOperation = operation({
  tags: ["Payment", "Khalti"],
  summary: "Verify Khalti payment",
  description:
    "Verifies a Khalti payment using pidx and updates the matching transaction and NFC balance through the payment service.",
  security: true,
  requestBody: jsonRequest("#/components/schemas/PaymentVerificationRequest", {
    pidx: "pidx-placeholder",
  }),
  successExample: apiSuccess(
    200,
    transactionExample,
    "Payment verified successfully",
  ),
  errors: [400, 401, 403, 404, 500],
});

const paymentStatusOperation = operation({
  tags: ["Payment", "Khalti"],
  summary: "Check Khalti payment status",
  description:
    "Looks up payment status by pidx or by transaction ID. If a completed Khalti payment is found for an unfinished transaction, the controller attempts to complete it.",
  parameters: [
    queryParam("pidx", "Khalti payment index.", { type: "string" }, "pidx-placeholder"),
    queryParam("txnId", "Internal transaction ID.", { type: "string" }, "TXN-1716357600000-ABCD"),
  ],
  successExample: apiSuccess(
    200,
    {
      status: "Completed",
      total_amount: 100,
      transaction_id: "khalti-transaction-id",
      pidx: "pidx-placeholder",
    },
    "Payment status retrieved",
  ),
  errors: [400, 500, 503],
});

const topupOperation = operation({
  tags: ["Recharge", "Khalti"],
  summary: "Start Khalti top-up transaction",
  description:
    "Creates a Khalti top-up transaction for the logged-in passenger's NFC card. The controller expects the amount in the `fare` field.",
  security: true,
  requestBody: jsonRequest("#/components/schemas/TopupRequest", {
    fare: 100,
  }),
  successExample: apiSuccess(
    200,
    {
      payment_url: "https://pay.khalti.com/?pidx=example",
      pidx: "pidx-placeholder",
      txnId: "TXN-1716357600000-ABCD",
      amount: 100,
      message: "Complete payment with Khalti.",
    },
    "Khalti payment initiated",
  ),
  errors: [400, 401, 403, 404, 500, 503],
});

const transactionHistoryOperation = operation({
  tags: ["Transactions"],
  summary: "Get passenger transaction history",
  description:
    "Returns paginated transaction history for the logged-in passenger with summary totals. Supported type filters are all, fare, khalti, pending, failed, and refunded.",
  security: true,
  parameters: [
    queryParam("page", "Page number.", { type: "integer", minimum: 1 }, 1),
    queryParam("limit", "Page size, capped at 100.", { type: "integer", minimum: 1, maximum: 100 }, 20),
    queryParam("type", "Transaction type filter.", { type: "string", enum: ["all", "fare", "khalti", "pending", "failed", "refunded"] }, "all"),
    queryParam("from", "Optional start date.", { type: "string", format: "date-time" }, "2026-05-01T00:00:00.000Z"),
    queryParam("to", "Optional end date.", { type: "string", format: "date-time" }, "2026-05-22T23:59:59.000Z"),
    queryParam("sort", "Sort order.", { type: "string", enum: ["asc", "desc"] }, "desc"),
  ],
  successExample: apiSuccess(
    200,
    {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      summary: {
        totalFareDebited: 20,
        totalKhaltiCredited: 100,
        totalPendingTopup: 0,
        netAmount: 80,
      },
      transactions: [transactionExample],
    },
    "Transaction history fetched successfully",
  ),
  errors: [400, 401, 403, 500],
});

const tapOperation = operation({
  tags: ["Fare", "NFC Cards"],
  summary: "Process NFC tap",
  description:
    "Processes an NFC tap for entry or exit. The service validates card status, checks duplicate taps, records trips, calculates fare on exit, deducts balance when possible, and creates pending payment transactions for insufficient balance.",
  requestBody: jsonRequest("#/components/schemas/TapRequest", {
    rfid: "ABCD1234",
    busId: busExample._id,
    latitude: "28.2096",
    longitude: "83.9856",
  }),
  successExample: apiSuccess(
    200,
    {
      status: "entry",
      message: "Entry recorded successfully",
      passengerName: "Nabin",
      tripId: "665f2a7f2d7c4a0012a34574",
      entryTime: "2026-05-22T10:00:00.000Z",
      entryLocation: { lat: 28.2096, lon: 83.9856 },
    },
    "Entry recorded successfully",
  ),
  errors: [400, 404, 429, 500],
});

const nfcBlockRequestOperation = operation({
  tags: ["NFC Cards"],
  summary: "Request NFC card blocking",
  description:
    "Submits a card block request for the passenger's default card or for a specific card ID owned by the passenger.",
  security: true,
  requestBody: jsonRequest("#/components/schemas/NFCBlockRequest", {
    cardId: nfcCardExample._id,
    reason: "Card lost",
  }),
  successExample: apiSuccess(
    200,
    { ...nfcCardExample, status: "block_requested" },
    "NFC card block request submitted",
  ),
  errors: [401, 403, 404, 500],
});

const roleBody = jsonRequest("#/components/schemas/RoleUpdateRequest", {
  role: "operator",
});

const adminSecurityDescription = "Requires a logged-in user with admin role.";

const operatorSecurityDescription = "Requires a logged-in user with operator role.";

const busLocationOperation = operation({
  tags: ["Bus Locations"],
  summary: "Get bus locations",
  description:
    "Returns buses that have valid currentLocation data. Operators only receive their own buses unless the user is also admin.",
  security: true,
  parameters: [
    queryParam("includeInactive", "Include inactive buses.", { type: "string", enum: ["true", "false"] }, "true"),
    queryParam("status", "Filter by bus status.", { type: "string", enum: ["idle", "running", "maintenance", "inactive"] }, "running"),
    queryParam("maxAgeMinutes", "Only return buses seen within this many minutes.", { type: "number" }, 30),
  ],
  successExample: apiSuccess(
    200,
    {
      count: 1,
      buses: [busExample],
    },
    "Bus locations fetched successfully",
  ),
  errors: [401, 500],
});

const singleBusLocationOperation = operation({
  tags: ["Bus Locations"],
  summary: "Get one bus location",
  description: "Returns location details for a single bus by MongoDB ObjectId.",
  parameters: [objectIdParam("busId", "Bus ID")],
  successExample: apiSuccess(
    200,
    busExample,
    "Bus location fetched successfully",
  ),
  errors: [400, 404, 500],
});

const deviceLocationOperation = operation({
  tags: ["Bus Locations"],
  summary: "Update bus location from device",
  description:
    "Updates bus location from an external GPS/device payload. If ESP32_GPS_API_KEY is set, the request must include the matching x-device-key header or deviceKey body value.",
  parameters: [
    {
      name: "x-device-key",
      in: "header",
      required: false,
      description: "Optional GPS device key when ESP32_GPS_API_KEY is configured.",
      schema: { type: "string" },
      example: "device-secret-placeholder",
    },
  ],
  requestBody: jsonRequest("#/components/schemas/DeviceLocationUpdateRequest", {
    busId: busExample._id,
    lat: 28.2096,
    lng: 83.9856,
  }),
  successExample: apiSuccess(
    200,
    { bus: busExample },
    "Bus location updated successfully",
  ),
  errors: [400, 401, 404, 500],
});

const operatorAnalyticsOperation = (summary, description, data, message) =>
  operation({
    tags: ["Operator Analytics"],
    summary,
    description,
    security: true,
    parameters: periodParameters,
    successExample: apiSuccess(200, data, message),
    errors: [400, 401, 403, 404, 500],
  });

const vehicleRegisterOperation = operation({
  tags: ["Operator Vehicles"],
  summary: "Register vehicle",
  description: `${operatorSecurityDescription} Creates a bus/vehicle for the operator.`,
  security: true,
  requestBody: jsonRequest("#/components/schemas/VehicleRegisterRequest", {
    plateNumber: "BA1CHA2345",
    busType: "standard",
    maxCapacity: 40,
  }),
  successCode: 201,
  successDescription: "Vehicle registered successfully",
  successExample: apiSuccess(201, busExample, "Vehicle registered successfully"),
  errors: [400, 401, 403, 409, 500],
});

const vehicleListOperation = operation({
  tags: ["Operator Vehicles"],
  summary: "List operator vehicles",
  description: operatorSecurityDescription,
  security: true,
  successExample: apiSuccess(
    200,
    { total: 1, buses: [busExample] },
    "Vehicles fetched successfully",
  ),
  errors: [401, 403, 500],
});

const vehicleDetailsOperation = operation({
  tags: ["Operator Vehicles"],
  summary: "Get vehicle details",
  description: operatorSecurityDescription,
  security: true,
  parameters: [objectIdParam("busId", "Bus ID")],
  successExample: apiSuccess(200, busExample, "Vehicle details fetched successfully"),
  errors: [400, 401, 403, 404, 500],
});

const vehicleDeleteOperation = operation({
  tags: ["Operator Vehicles"],
  summary: "Delete vehicle",
  description: operatorSecurityDescription,
  security: true,
  parameters: [objectIdParam("busId", "Bus ID")],
  successExample: apiSuccess(200, {}, "Vehicle deleted successfully"),
  errors: [400, 401, 403, 404, 500],
});

const vehicleStatusOperation = operation({
  tags: ["Operator Vehicles"],
  summary: "Update vehicle status",
  description: operatorSecurityDescription,
  security: true,
  parameters: [objectIdParam("busId", "Bus ID")],
  requestBody: jsonRequest("#/components/schemas/VehicleStatusUpdateRequest", {
    status: "running",
  }),
  successExample: apiSuccess(
    200,
    { _id: busExample._id, status: "running" },
    "Vehicle status updated",
  ),
  errors: [400, 401, 403, 404, 500],
});

const driverListOperation = operation({
  tags: ["Operator Drivers"],
  summary: "List operator drivers",
  description: operatorSecurityDescription,
  security: true,
  successExample: apiSuccess(
    200,
    { total: 1, drivers: [driverExample] },
    "Drivers fetched successfully",
  ),
  errors: [401, 403, 500],
});

const driverIdBody = jsonRequest("#/components/schemas/DriverIdRequest", {
  driverId: driverExample._id,
});

const assignmentBody = jsonRequest("#/components/schemas/AssignmentRequest", {
  busId: busExample._id,
  driverId: driverExample._id,
});

export const tags = [
  { name: "Health", description: "Health check endpoint." },
  { name: "Auth", description: "Registration, login, logout, and token refresh." },
  { name: "Users", description: "User profile endpoints." },
  { name: "NFC Cards", description: "NFC card registration, verification, blocking, and validation flows." },
  { name: "Fare", description: "NFC tap and fare collection endpoints." },
  { name: "Recharge", description: "NFC card top-up endpoints." },
  { name: "Payment", description: "Payment initiation, verification, callback, and status endpoints." },
  { name: "Khalti", description: "Khalti ePayment integration endpoints." },
  { name: "Transactions", description: "Transaction history endpoints." },
  { name: "Admin", description: "Admin user, role, and NFC card management." },
  { name: "Operators", description: "Operator authentication and profile endpoints." },
  { name: "Operator Vehicles", description: "Operator vehicle management endpoints." },
  { name: "Operator Drivers", description: "Operator driver management endpoints." },
  { name: "Operator Analytics", description: "Operator dashboard and reporting endpoints." },
  { name: "Drivers", description: "Driver authentication and driver app endpoints." },
  { name: "Bus Locations", description: "Bus GPS location endpoints." },
  { name: "Vehicles", description: "Shared vehicle endpoints mounted under user routes." },
];

export const components = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
  schemas: {
    SuccessResponse: {
      type: "object",
      properties: {
        statusCode: { type: "integer", example: 200 },
        data: { type: "object", additionalProperties: true },
        message: { type: "string", example: "success" },
        success: { type: "boolean", example: true },
      },
    },
    ErrorResponse: {
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "Something went wrong" },
        errors: {
          type: "array",
          items: { type: "object", additionalProperties: true },
        },
        stack: {
          type: "string",
          description: "Only included when NODE_ENV is development.",
        },
      },
    },
    User: {
      type: "object",
      properties: {
        _id: { type: "string", example: objectIdExample },
        nid: { type: "string", example: "12-34-56-123456" },
        FirstName: { type: "string", example: "Nabin" },
        phone: { type: "string", example: "9812345678" },
        email: { type: "string", format: "email", example: "nabin@example.com" },
        user_type: {
          type: "array",
          items: { type: "string", enum: ["passenger", "driver", "operator", "admin"] },
        },
        defaultNfcCard: { type: "string", nullable: true },
        balance: { type: "number", example: 0 },
        isVerified: { type: "boolean", example: false },
        onBoard: { type: "boolean", example: false },
      },
    },
    RegisterRequest: {
      type: "object",
      required: ["nid", "FirstName", "email", "phone", "password"],
      properties: {
        nid: { type: "string", example: "12-34-56-123456" },
        FirstName: { type: "string", minLength: 3, maxLength: 50, example: "Nabin" },
        email: { type: "string", format: "email", example: "nabin@example.com" },
        phone: { type: "string", example: "9812345678" },
        password: { type: "string", minLength: 8, example: "Password1" },
      },
    },
    LoginRequest: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email", example: "nabin@example.com" },
        password: { type: "string", example: "Password1" },
      },
    },
    RefreshTokenRequest: {
      type: "object",
      properties: {
        refreshToken: {
          type: "string",
          description: "Optional when the refreshToken cookie is present.",
          example: "jwt-refresh-token-placeholder",
        },
      },
    },
    DriverRegisterRequest: {
      allOf: [
        { $ref: "#/components/schemas/RegisterRequest" },
        {
          type: "object",
          required: ["license_number", "license_expiry"],
          properties: {
            license_number: { type: "string", example: "DL-2024-9999" },
            license_expiry: { type: "string", format: "date", example: "2027-01-01" },
          },
        },
      ],
    },
    OperatorRegisterRequest: {
      allOf: [
        { $ref: "#/components/schemas/RegisterRequest" },
        {
          type: "object",
          required: ["company_name"],
          properties: {
            company_name: { type: "string", example: "Sahaj Yatra Transport" },
          },
        },
      ],
    },
    NFCCard: {
      type: "object",
      properties: {
        _id: { type: "string", example: nfcCardExample._id },
        id: { type: "string", example: nfcCardExample._id },
        cardUid: { type: "string", example: "AB****12" },
        maskedCardUid: { type: "string", example: "AB****12" },
        cardType: { type: "string", enum: ["personal", "student", "senior", "temporary"] },
        status: { type: "string", enum: ["active", "block_requested", "blocked"] },
        isActive: { type: "boolean", example: true },
        isVerified: { type: "boolean", example: false },
        balance: { type: "number", example: 0 },
      },
    },
    NFCCardRegisterRequest: {
      type: "object",
      required: ["cardUid"],
      properties: {
        cardUid: { type: "string", example: "ABCD1234" },
        cardType: { type: "string", enum: ["personal", "student", "senior"], example: "personal" },
      },
    },
    NFCBlockRequest: {
      type: "object",
      properties: {
        cardId: { type: "string", example: nfcCardExample._id },
        reason: { type: "string", example: "Card lost" },
      },
    },
    TapRequest: {
      type: "object",
      required: ["rfid", "busId", "latitude", "longitude"],
      properties: {
        rfid: { type: "string", example: "ABCD1234" },
        busId: { type: "string", example: busExample._id },
        latitude: { type: "string", example: "28.2096" },
        longitude: { type: "string", example: "83.9856" },
      },
    },
    PaymentInitiateRequest: {
      type: "object",
      required: ["txnId"],
      properties: {
        txnId: { type: "string", example: "TXN-1716357600000-ABCD" },
      },
    },
    PaymentVerificationRequest: {
      type: "object",
      required: ["pidx"],
      properties: {
        pidx: { type: "string", example: "pidx-placeholder" },
      },
    },
    TopupRequest: {
      type: "object",
      required: ["fare"],
      properties: {
        fare: {
          type: "number",
          description: "Top-up amount in NPR. The existing controller reads this from the field named fare.",
          example: 100,
        },
      },
    },
    Transaction: {
      type: "object",
      properties: {
        txnId: { type: "string", example: "TXN-1716357600000-ABCD" },
        status: {
          type: "string",
          enum: [
            "pending_exit",
            "payment_initiated",
            "completed",
            "no_tap_out",
            "failed",
            "refunded",
            "payment_required",
          ],
        },
        fare: { type: "number", example: 20 },
        requiredTopup: { type: "number", example: 0 },
        paymentMethod: { type: "string", enum: ["nfc_card", "khalti", "khalti_auto"] },
      },
    },
    Bus: {
      type: "object",
      properties: {
        _id: { type: "string", example: busExample._id },
        plateNumber: { type: "string", example: "BA1CHA2345" },
        busType: { type: "string", enum: ["standard", "express", "luxury"] },
        maxCapacity: { type: "integer", example: 40 },
        status: { type: "string", enum: ["idle", "running", "maintenance", "inactive"] },
      },
    },
    VehicleRegisterRequest: {
      type: "object",
      required: ["plateNumber", "maxCapacity"],
      properties: {
        plateNumber: { type: "string", example: "BA1CHA2345" },
        busType: { type: "string", enum: ["standard", "express", "luxury"], example: "standard" },
        maxCapacity: { type: "integer", minimum: 1, maximum: 100, example: 40 },
        driverId: { type: "string", example: driverExample._id },
      },
    },
    VehicleStatusUpdateRequest: {
      type: "object",
      required: ["status"],
      properties: {
        status: { type: "string", enum: ["idle", "running", "maintenance", "inactive"], example: "running" },
      },
    },
    LocationUpdateRequest: {
      type: "object",
      required: ["lat", "lng"],
      properties: {
        lat: { type: "number", minimum: -90, maximum: 90, example: 28.2096 },
        lng: { type: "number", minimum: -180, maximum: 180, example: 83.9856 },
      },
    },
    DeviceLocationUpdateRequest: {
      allOf: [
        { $ref: "#/components/schemas/LocationUpdateRequest" },
        {
          type: "object",
          required: ["busId"],
          properties: {
            busId: { type: "string", example: busExample._id },
            deviceKey: { type: "string", example: "device-secret-placeholder" },
          },
        },
      ],
    },
    RoleUpdateRequest: {
      type: "object",
      required: ["role"],
      properties: {
        role: { type: "string", enum: ["driver", "passenger", "operator", "admin"], example: "operator" },
      },
    },
    DriverIdRequest: {
      type: "object",
      required: ["driverId"],
      properties: {
        driverId: { type: "string", example: driverExample._id },
      },
    },
    AssignmentRequest: {
      type: "object",
      required: ["busId", "driverId"],
      properties: {
        busId: { type: "string", example: busExample._id },
        driverId: { type: "string", example: driverExample._id },
      },
    },
    UnassignRequest: {
      type: "object",
      required: ["busId"],
      properties: {
        busId: { type: "string", example: busExample._id },
      },
    },
    SwapDriverRequest: {
      type: "object",
      required: ["busId", "newDriverId"],
      properties: {
        busId: { type: "string", example: busExample._id },
        newDriverId: { type: "string", example: driverExample._id },
      },
    },
  },
  responses: {
    BadRequest: {
      description: "Bad request or validation error",
      content: { "application/json": { example: apiError("Invalid request data") } },
    },
    Unauthorized: {
      description: "Authentication is missing or invalid",
      content: { "application/json": { example: apiError("Invalid or expired access token") } },
    },
    Forbidden: {
      description: "Authenticated user does not have permission",
      content: { "application/json": { example: apiError("Access denied. Required role: admin") } },
    },
    NotFound: {
      description: "Requested resource was not found",
      content: { "application/json": { example: apiError("Resource not found") } },
    },
    Conflict: {
      description: "Duplicate or conflicting resource state",
      content: { "application/json": { example: apiError("Resource already exists") } },
    },
    TooManyRequests: {
      description: "Duplicate tap or rate-style guard",
      content: { "application/json": { example: apiError("Card tapped too quickly. Please wait 5 second(s).") } },
    },
    InternalServerError: {
      description: "Unexpected server error",
      content: { "application/json": { example: apiError("Something went wrong") } },
    },
    ServiceUnavailable: {
      description: "External payment service unavailable",
      content: {
        "application/json": {
          example: {
            success: false,
            message: "Khalti service is temporarily unavailable. Please try again in a few minutes.",
          },
        },
      },
    },
  },
};

export const paths = {
  "/api/v1/health": {
    get: operation({
      tags: ["Health"],
      summary: "Health check",
      description: "Checks whether the backend API is responding.",
      successExample: apiSuccess(200, { data: "data" }, "ok Healthcheck passed"),
      errors: [500],
    }),
  },
  "/api/v1/users/register": { post: registerPassengerOperation },
  "/api/v1/users/login": { post: loginPassengerOperation },
  "/api/v1/users/logout": { post: logoutOperation },
  "/api/v1/users/user/register": { post: registerPassengerOperation },
  "/api/v1/users/user/login": { post: loginPassengerOperation },
  "/api/v1/users/user/logout": { post: logoutOperation },
  "/api/v1/users/driver/register": { post: driverRegisterOperation },
  "/api/v1/users/driver/login": { post: driverLoginOperation },
  "/api/v1/users/driver/profile": {
    get: operation({
      tags: ["Drivers"],
      summary: "Get driver profile",
      description: "Requires driver role.",
      security: true,
      successExample: apiSuccess(
        200,
        { user: { ...userExample, user_type: ["driver"] }, driver: driverExample },
        "Driver profile fetched successfully",
      ),
      errors: [401, 403, 404, 500],
    }),
  },
  "/api/v1/users/driver/logout": { post: logoutOperation },
  "/api/v1/users/operator/register": { post: operatorRegisterOperation },
  "/api/v1/users/operator/login": { post: operatorLoginOperation },
  "/api/v1/users/operator/profile": {
    get: operation({
      tags: ["Operators"],
      summary: "Get operator profile",
      description: "Requires operator role.",
      security: true,
      successExample: apiSuccess(
        200,
        { user: { ...userExample, user_type: ["operator"] }, operator: operatorExample },
        "Operator profile fetched successfully",
      ),
      errors: [401, 403, 404, 500],
    }),
  },
  "/api/v1/users/operator/logout": { post: logoutOperation },
  "/api/v1/users/auth/refresh-token": {
    post: operation({
      tags: ["Auth"],
      summary: "Refresh access token",
      description:
        "Uses the refreshToken cookie or refreshToken body field to generate a new access token and refresh token.",
      requestBody: jsonRequest(
        "#/components/schemas/RefreshTokenRequest",
        { refreshToken: "jwt-refresh-token-placeholder" },
        false,
      ),
      successExample: apiSuccess(
        200,
        {
          accessToken: "jwt-access-token-placeholder",
          refreshToken: "jwt-refresh-token-placeholder",
        },
        "Access token refreshed successfully",
      ),
      errors: [400, 401, 500],
    }),
  },
  "/api/v1/users/profile": { get: profileOperation },
  "/api/v1/users/registerNfc": { post: registerNfcOperation },
  "/api/v1/users/vehicle/{busId}/location": {
    patch: vehicleLocationOperation,
  },
  "/api/v1/users/payment/initiate": { post: paymentInitiateOperation },
  "/api/v1/users/payment/verify": { post: paymentVerifyOperation },
  "/api/v1/users/payment/status": { get: paymentStatusOperation },
  "/api/v1/users/payment/khalti/callback": {
    get: {
      tags: ["Payment", "Khalti"],
      summary: "Khalti payment callback",
      description:
        "Callback endpoint used by Khalti after payment. It verifies the pidx and returns a small HTML page, not JSON.",
      parameters: [
        queryParam("pidx", "Khalti payment index.", { type: "string" }, "pidx-placeholder"),
        queryParam("status", "Khalti status query value.", { type: "string" }, "Completed"),
      ],
      responses: {
        200: {
          description: "Payment callback processed",
          content: {
            "text/html": {
              example:
                "<h2>Payment Successful</h2><p>Status: Completed</p><p>You can safely close this window.</p>",
            },
          },
        },
        400: {
          description: "Missing or invalid callback data",
          content: {
            "text/html": {
              example: "<h2>Invalid Callback</h2><p>Missing pidx parameter.</p>",
            },
          },
        },
      },
    },
  },
  "/api/v1/users/payment/transaction": { post: topupOperation },
  "/api/v1/users/payment/transactions": { get: transactionHistoryOperation },
  "/api/v1/user/tap": { post: tapOperation },
  "/api/v1/nfc/block-request": { post: nfcBlockRequestOperation },
  "/api/v1/admin/get-all-data": {
    get: operation({
      tags: ["Admin"],
      summary: "Get all users",
      description: adminSecurityDescription,
      security: true,
      successExample: apiSuccess(200, [userExample], "All users are fetched"),
      errors: [401, 403, 500],
    }),
  },
  "/api/v1/admin/update-role/{userId}": {
    patch: operation({
      tags: ["Admin"],
      summary: "Add or update user role",
      description: adminSecurityDescription,
      security: true,
      parameters: [objectIdParam("userId", "User ID")],
      requestBody: roleBody,
      successExample: apiSuccess(200, {}, "operator role added successfully"),
      errors: [400, 401, 403, 404, 500],
    }),
  },
  "/api/v1/admin/verify-user/{userId}": {
    patch: operation({
      tags: ["Admin"],
      summary: "Verify user",
      description: adminSecurityDescription,
      security: true,
      parameters: [objectIdParam("userId", "User ID")],
      successExample: apiSuccess(200, { ...userExample, isVerified: true }, "User verified successfully"),
      errors: [401, 403, 404, 500],
    }),
  },
  "/api/v1/admin/remove-role/{userId}": {
    patch: operation({
      tags: ["Admin"],
      summary: "Remove user role",
      description: adminSecurityDescription,
      security: true,
      parameters: [objectIdParam("userId", "User ID")],
      requestBody: roleBody,
      successExample: apiSuccess(200, {}, "operator role removed"),
      errors: [400, 401, 403, 404, 500],
    }),
  },
  "/api/v1/admin/delete-user/{userId}": {
    delete: operation({
      tags: ["Admin"],
      summary: "Delete user",
      description: adminSecurityDescription,
      security: true,
      parameters: [objectIdParam("userId", "User ID")],
      successExample: apiSuccess(
        200,
        { _id: objectIdExample, FirstName: "Nabin", email: "nabin@example.com" },
        "User deleted permanently",
      ),
      errors: [400, 401, 403, 404, 500],
    }),
  },
  "/api/v1/admin/pending": {
    get: operation({
      tags: ["Admin", "NFC Cards"],
      summary: "Get pending NFC cards",
      description: adminSecurityDescription,
      security: true,
      successExample: apiSuccess(200, [nfcCardExample], "Pending NFC card requests fetched successfully"),
      errors: [401, 403, 500],
    }),
  },
  "/api/v1/admin/verify/{id}": {
    patch: operation({
      tags: ["Admin", "NFC Cards"],
      summary: "Verify NFC card",
      description: adminSecurityDescription,
      security: true,
      parameters: [objectIdParam("id", "NFC card ID")],
      successExample: apiSuccess(200, { ...nfcCardExample, isVerified: true }, "NFC card verified successfully"),
      errors: [401, 403, 404, 500],
    }),
  },
  "/api/v1/admin/reject/{id}": {
    delete: operation({
      tags: ["Admin", "NFC Cards"],
      summary: "Reject NFC card",
      description: adminSecurityDescription,
      security: true,
      parameters: [objectIdParam("id", "NFC card ID")],
      successExample: apiSuccess(200, null, "Card registration rejected"),
      errors: [401, 403, 404, 500],
    }),
  },
  "/api/v1/admin/nfc/block-requests": {
    get: operation({
      tags: ["Admin", "NFC Cards"],
      summary: "Get NFC block requests",
      description: adminSecurityDescription,
      security: true,
      parameters: [
        queryParam("includeBlocked", "Include already blocked cards.", { type: "string", enum: ["true", "false"] }, "false"),
      ],
      successExample: apiSuccess(200, [nfcCardExample], "NFC block requests fetched successfully"),
      errors: [401, 403, 500],
    }),
  },
  "/api/v1/admin/nfc/{cardId}/block": {
    patch: operation({
      tags: ["Admin", "NFC Cards"],
      summary: "Block NFC card",
      description: adminSecurityDescription,
      security: true,
      parameters: [objectIdParam("cardId", "NFC card ID")],
      successExample: apiSuccess(200, { ...nfcCardExample, status: "blocked", isActive: false }, "NFC card blocked successfully"),
      errors: [401, 403, 404, 500],
    }),
  },
  "/api/v1/admin/nfc/{cardId}/reject-block": {
    patch: operation({
      tags: ["Admin", "NFC Cards"],
      summary: "Reject NFC block request",
      description: adminSecurityDescription,
      security: true,
      parameters: [objectIdParam("cardId", "NFC card ID")],
      successExample: apiSuccess(200, { ...nfcCardExample, status: "active" }, "NFC block request rejected"),
      errors: [401, 403, 404, 500],
    }),
  },
  "/api/v1/admin/nfc/{cardId}/unblock": {
    patch: operation({
      tags: ["Admin", "NFC Cards"],
      summary: "Unblock NFC card",
      description: adminSecurityDescription,
      security: true,
      parameters: [objectIdParam("cardId", "NFC card ID")],
      successExample: apiSuccess(200, { ...nfcCardExample, status: "active", isActive: true }, "NFC card unblocked successfully"),
      errors: [401, 403, 404, 500],
    }),
  },
  "/api/v1/operator/profile": {
    get: operation({
      tags: ["Operators"],
      summary: "Get operator profile",
      description: operatorSecurityDescription,
      security: true,
      successExample: apiSuccess(200, { user: userExample, operator: operatorExample }, "Profile fetched successfully"),
      errors: [401, 403, 404, 500],
    }),
  },
  "/api/v1/operator/vehicle/register": { post: vehicleRegisterOperation },
  "/api/v1/operator/vehicle/list": { get: vehicleListOperation },
  "/api/v1/operator/vehicle/unassigned": {
    get: operation({
      tags: ["Operator Vehicles"],
      summary: "List unassigned buses",
      description: operatorSecurityDescription,
      security: true,
      successExample: apiSuccess(200, { total: 1, buses: [busExample] }, "Unassigned buses fetched"),
      errors: [401, 403, 500],
    }),
  },
  "/api/v1/operator/vehicle/{busId}": {
    get: vehicleDetailsOperation,
    delete: vehicleDeleteOperation,
  },
  "/api/v1/operator/vehicle/{busId}/status": {
    patch: vehicleStatusOperation,
  },
  "/api/v1/operator/vehicle/{busId}/location": {
    patch: vehicleLocationOperation,
  },
  "/api/v1/operator/driver/list": { get: driverListOperation },
  "/api/v1/operator/driver/available": {
    get: operation({
      tags: ["Operator Drivers"],
      summary: "List available drivers",
      description: operatorSecurityDescription,
      security: true,
      successExample: apiSuccess(200, { total: 1, drivers: [driverExample] }, "Available drivers fetched"),
      errors: [401, 403, 500],
    }),
  },
  "/api/v1/operator/driver/add": {
    post: operation({
      tags: ["Operator Drivers"],
      summary: "Add driver to operator",
      description: operatorSecurityDescription,
      security: true,
      requestBody: driverIdBody,
      successExample: apiSuccess(200, driverExample, "Driver added to operator successfully"),
      errors: [400, 401, 403, 404, 409, 500],
    }),
  },
  "/api/v1/operator/driver/remove": {
    post: operation({
      tags: ["Operator Drivers"],
      summary: "Remove driver from operator",
      description: operatorSecurityDescription,
      security: true,
      requestBody: driverIdBody,
      successExample: apiSuccess(200, {}, "Driver removed from operator successfully"),
      errors: [400, 401, 403, 404, 409, 500],
    }),
  },
  "/api/v1/operator/assignment/assign": {
    post: operation({
      tags: ["Operator Drivers", "Operator Vehicles"],
      summary: "Assign driver to bus",
      description: operatorSecurityDescription,
      security: true,
      requestBody: assignmentBody,
      successExample: apiSuccess(200, { bus: busExample, driver: driverExample }, "Driver assigned to bus successfully"),
      errors: [400, 401, 403, 404, 409, 500],
    }),
  },
  "/api/v1/operator/assignment/unassign": {
    post: operation({
      tags: ["Operator Drivers", "Operator Vehicles"],
      summary: "Unassign driver from bus",
      description: operatorSecurityDescription,
      security: true,
      requestBody: jsonRequest("#/components/schemas/UnassignRequest", { busId: busExample._id }),
      successExample: apiSuccess(200, { bus: busExample, driver: driverExample }, "Driver unassigned successfully"),
      errors: [400, 401, 403, 404, 409, 500],
    }),
  },
  "/api/v1/operator/assignment/swap": {
    post: operation({
      tags: ["Operator Drivers", "Operator Vehicles"],
      summary: "Swap driver on bus",
      description: operatorSecurityDescription,
      security: true,
      requestBody: jsonRequest("#/components/schemas/SwapDriverRequest", {
        busId: busExample._id,
        newDriverId: driverExample._id,
      }),
      successExample: apiSuccess(200, { bus: busExample, driver: driverExample }, "Driver swapped successfully"),
      errors: [400, 401, 403, 404, 409, 500],
    }),
  },
  "/api/v1/operator/analytics/overview": {
    get: operatorAnalyticsOperation(
      "Get operator analytics overview",
      "Returns fleet counts, driver counts, revenue, trips, and top performance metrics for the operator.",
      {
        period: "month",
        fleet: { totalBuses: 3, runningBuses: 2 },
        drivers: { totalDrivers: 2, availableDrivers: 1 },
        revenue: { totalRevenue: 2200, periodRevenue: 1200 },
      },
      "Operator overview fetched",
    ),
  },
  "/api/v1/operator/analytics/revenue": {
    get: operatorAnalyticsOperation(
      "Get revenue trend",
      "Returns time-series revenue and trip counts for the selected period.",
      {
        period: "month",
        points: [{ label: "2026-05-22", revenue: 400, trips: 20 }],
      },
      "Revenue trend fetched",
    ),
  },
  "/api/v1/operator/analytics/buses": {
    get: operatorAnalyticsOperation(
      "Get bus analytics",
      "Returns bus performance analytics for the selected period.",
      {
        period: "month",
        buses: [{ bus: busExample, revenue: 1200, trips: 30 }],
      },
      "Bus analytics fetched",
    ),
  },
  "/api/v1/operator/analytics/drivers": {
    get: operatorAnalyticsOperation(
      "Get driver analytics",
      "Returns driver performance analytics for the selected period.",
      {
        period: "month",
        drivers: [{ driver: driverExample, revenue: 1200, trips: 30 }],
      },
      "Driver analytics fetched",
    ),
  },
  "/api/v1/operator/analytics/fleet-comparison": {
    get: operatorAnalyticsOperation(
      "Get fleet comparison",
      "Returns side-by-side revenue and trip comparison of operator buses.",
      {
        period: "month",
        buses: [{ plateNumber: "BA1CHA2345", revenue: 1200, trips: 30 }],
      },
      "Fleet comparison fetched",
    ),
  },
  "/api/v1/operator/analytics/buses/{busId}": {
    get: operation({
      tags: ["Operator Analytics"],
      summary: "Get bus detail analytics",
      description: "Returns summary, trend, and driver information for one bus.",
      security: true,
      parameters: [objectIdParam("busId", "Bus ID"), ...periodParameters],
      successExample: apiSuccess(
        200,
        { period: "month", bus: busExample, trend: [{ label: "2026-05-22", revenue: 400, trips: 20 }] },
        "Bus analytics fetched successfully",
      ),
      errors: [400, 401, 403, 404, 500],
    }),
  },
  "/api/v1/operator/analytics/drivers/{driverId}": {
    get: operation({
      tags: ["Operator Analytics"],
      summary: "Get driver detail analytics",
      description: "Returns summary, trend, and bus information for one driver.",
      security: true,
      parameters: [objectIdParam("driverId", "Driver ID"), ...periodParameters],
      successExample: apiSuccess(
        200,
        { period: "month", driver: driverExample, trend: [{ label: "2026-05-22", revenue: 400, trips: 20 }] },
        "Driver analytics fetched successfully",
      ),
      errors: [400, 401, 403, 404, 500],
    }),
  },
  "/api/v1/driver/tap-events/recent": {
    get: operation({
      tags: ["Drivers", "Fare"],
      summary: "Get recent driver tap events",
      description:
        "Returns recent tap events for the bus assigned to the logged-in driver. If no bus is assigned, the controller returns an empty list.",
      security: true,
      parameters: [
        queryParam("limit", "Number of events to return. The controller caps this at 50.", { type: "integer", minimum: 1, maximum: 50 }, 20),
      ],
      successExample: apiSuccess(
        200,
        { count: 1, events: [tapEventExample] },
        "Recent tap events fetched successfully",
      ),
      errors: [401, 403, 404, 500],
    }),
  },
  "/api/v1/bus/locations": { get: busLocationOperation },
  "/api/v1/bus/update-location": { post: deviceLocationOperation },
  "/api/v1/bus/{busId}": { get: singleBusLocationOperation },
  "/api/v1/buses/locations": { get: busLocationOperation },
  "/api/v1/buses/update-location": { post: deviceLocationOperation },
  "/api/v1/buses/{busId}": { get: singleBusLocationOperation },
  "/bus/locations": { get: busLocationOperation },
  "/bus/update-location": { post: deviceLocationOperation },
  "/bus/{busId}": { get: singleBusLocationOperation },
};
