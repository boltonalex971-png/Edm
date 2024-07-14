using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO.Ports;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microprojects.Edm.Drivers;
using Newtonsoft.Json;

namespace Optosense.Edm.Drivers.RestApi
{
    [Driver(OptionsType = typeof(RestApiDriverOptions))]
    public class RestApiDriver : DriverBase, IParamProvider, IParamConsumer, IDisposable
    {
        protected RestApiDriverOptions ApiOptions => (RestApiDriverOptions)Options;
        protected HttpClient HttpClient { get; } = new();

        public RestApiDriver() { }

        public RestApiDriver(RestApiDriverOptions p)
        {
            Options = p;
        }

        public override string Init()
        {
            HttpClient.BaseAddress = new Uri(ApiOptions.BaseUrl);
            HttpClient.DefaultRequestHeaders.Accept.Clear();
            HttpClient.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue(ApiOptions.ContentType));
            return OK;
        }

        public override string Stop()
        {
            Debug.WriteLine("Serial stopping...");
            Dispose();
            return OK;
        }
        public async Task<DriverResponse> GetParam(string parameterName)
        {
            var result = new DriverResponse
            {
                Request = parameterName,
                State = DriverResponseState.Ok
            };
            try
            {
                var response = await HttpClient.PostAsJsonAsync("serials", ApiOptions.InitialSerialNo);
                response.EnsureSuccessStatusCode();
                result.Response = await response.Content.ReadAsStringAsync();
                result.Parameters = $"{{\"{parameterName}\": {result.Response}}}";
            }
            catch (Exception ex)
            {
                result.Message = ex.Message;
                result.State = DriverResponseState.Failed;
            }

            return result;
        }

        public async Task SetParamAsync(string name, object value)
        {
            try
            {
                var response = await HttpClient.PutAsJsonAsync("serials", value);
                response.EnsureSuccessStatusCode();
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error: {ex.Message}");
                // TODO handle exception 
            }
        }

        public void Dispose()
        {
            HttpClient.Dispose();
        }
    }

    public class RestApiDriverOptions : IDriverOptions
    {
        public int InitialSerialNo { get; set; }
        public string BaseUrl { get; set; } = "http://localhost:5000";
        public string ContentType { get; set; } = "application/json";
        public string Token { get; set; } = string.Empty;
    }
}
