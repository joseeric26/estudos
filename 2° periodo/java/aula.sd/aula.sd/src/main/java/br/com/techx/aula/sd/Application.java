package br.com.techx.aula.sd;

import lombok.Data;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@Data
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}


}
